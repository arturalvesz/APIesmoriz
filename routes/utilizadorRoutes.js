const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

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
    const { nome, email, password } = req.body;
    const utilizadorAtualizado = await pool.query(
      'UPDATE utilizador SET nome = $1, email = $2, password = $3 WHERE id = $4 RETURNING *',
      [nome, email, password, id]
    );
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
