const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");


const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Rota para atualizar um usuário existente adicionando o userId com base no email
router.put('/add-user-id', async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o email já está em uso no Firebase Authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    // Atualizar o usuário existente no PostgreSQL adicionando o userId
    const updatedUser = await pool.query(
      'UPDATE utilizador SET userId = $1 WHERE email = $2 RETURNING *',
      [userId, email]
    );

    // Verificar se o usuário foi atualizado com sucesso
    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error('Erro ao adicionar userId ao usuário:', err);
    res.status(500).json({ error: 'Erro ao adicionar userId ao usuário' });
  }
});

// Criar um novo utilizador
router.post('/novo', async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    // Hashear a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir o novo usuário com a senha hasheada
    const novoUtilizador = await pool.query(
      'INSERT INTO utilizador (nome, email, password) VALUES ($1, $2, $3) RETURNING *',
      [nome, email, hashedPassword]
    );
    res.json(novoUtilizador.rows[0]);
  } catch (err) {
    console.error('Erro ao criar utilizador:', err);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
});

// Obter todos os utilizadores
router.get('/all', async (req, res) => {
  try {
    const todosUtilizadores = await pool.query('SELECT * FROM utilizador');
    res.json(todosUtilizadores.rows);
  } catch (err) {
    console.error('Erro ao obter utilizadores:', err);
    res.status(500).json({ error: 'Erro ao obter utilizadores' });
  }
});

// Obter um único utilizador pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilizador = await pool.query('SELECT * FROM utilizador WHERE id = $1', [id]);
    if (utilizador.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    res.json(utilizador.rows[0]);
  } catch (err) {
    console.error('Erro ao obter utilizador pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter utilizador pelo ID' });
  }
});

// Atualizar um utilizador
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, password, confirmPassword } = req.body;

    // Verificar se a nova senha e a confirmação de senha correspondem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'A nova senha e a confirmação de senha não correspondem' });
    }

    let updateQuery = 'UPDATE utilizador SET';
    let queryParams = [];
    let paramCount = 1;

    if (nome) {
      updateQuery += ` nome = $${paramCount},`;
      queryParams.push(nome);
      paramCount++;
    }

    if (email) {
      updateQuery += ` email = $${paramCount},`;
      queryParams.push(email);
      paramCount++;
    }

    if (password) {
      updateQuery += ` password = $${paramCount},`;
      queryParams.push(password);
      paramCount++;
    }

    // Remove a vírgula extra do final e adiciona a cláusula WHERE
    updateQuery = updateQuery.slice(0, -1) + ` WHERE id = $${paramCount} RETURNING *`;
    queryParams.push(id);

    const utilizadorAtualizado = await pool.query(updateQuery, queryParams);

    if (utilizadorAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(utilizadorAtualizado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar utilizador:', err);
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
});




// Excluir um utilizador
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilizadorExcluido = await pool.query('DELETE FROM utilizador WHERE id = $1 RETURNING *', [id]);
    if (utilizadorExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    res.json({ message: 'Utilizador excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir utilizador:', err);
    res.status(500).json({ error: 'Erro ao excluir utilizador' });
  }
});

// Associar um sócio a um usuário
router.post('/addSocioToUtilizador', async (req, res) => {
  try {
    const { idUsuario, numSocio } = req.body;
    
    // Verificar se o usuário existe
    const usuario = await pool.query('SELECT * FROM utilizador WHERE id = $1', [idUsuario]);
    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o sócio existe
    const socio = await pool.query('SELECT * FROM socio WHERE num_socio = $1', [numSocio]);
    if (socio.rows.length === 0) {
      return res.status(404).json({ error: 'Sócio não encontrado' });
    }

    // Atualizar o ID do usuário no sócio
    await pool.query('UPDATE socio SET user_id = $1 WHERE num_socio = $2', [idUsuario, numSocio]);

    res.json({ message: 'Sócio associado ao usuário com sucesso' });
  } catch (err) {
    console.error('Erro ao associar sócio ao usuário:', err);
    res.status(500).json({ error: 'Erro ao associar sócio ao usuário' });
  }
});

module.exports = router;
