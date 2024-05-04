const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo sócio
router.post('/novo', async (req, res) => {
  try {
    const { num_socio, data_nascimento } = req.body;
    
    const novoSocio = await pool.query(
      'INSERT INTO Socio (num_socio, data_nascimento) VALUES ($1, $2) RETURNING *',
      [num_socio, new Date(data_nascimento).toISOString().split('T')[0]] // Extrai apenas a data
    );
    res.json(novoSocio.rows[0]);
  } catch (err) {
    console.error('Erro ao criar sócio:', err);
    res.status(500).json({ error: 'Erro ao criar sócio' });
  }
});
// Obter todos os sócios
router.get('/all', async (req, res) => {
  try {
    const todosSocios = await pool.query('SELECT * FROM Socio');
    res.json(todosSocios.rows);
  } catch (err) {
    console.error('Erro ao obter sócios:', err);
    res.status(500).json({ error: 'Erro ao obter sócios' });
  }
});

// Obter um único sócio pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const socio = await pool.query('SELECT * FROM Socio WHERE id = $1', [id]);
    if (socio.rows.length === 0) {
      return res.status(404).json({ error: 'Sócio não encontrado' });
    }
    res.json(socio.rows[0]);
  } catch (err) {
    console.error('Erro ao obter sócio pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter sócio pelo ID' });
  }
});

// Atualizar um sócio
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { num_socio, user_id } = req.body;
    const socioAtualizado = await pool.query(
      'UPDATE Socio SET num_socio = $1, user_id = $2 WHERE id = $3 RETURNING *',
      [num_socio, user_id, id]
    );
    if (socioAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Sócio não encontrado' });
    }
    res.json(socioAtualizado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar sócio:', err);
    res.status(500).json({ error: 'Erro ao atualizar sócio' });
  }
});

// Excluir um sócio
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const socioExcluido = await pool.query('DELETE FROM Socio WHERE id = $1 RETURNING *', [id]);
    if (socioExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Sócio não encontrado' });
    }
    res.json({ message: 'Sócio excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir sócio:', err);
    res.status(500).json({ error: 'Erro ao excluir sócio' });
  }
});

// Rota para verificar se o usuário já tem um sócio associado
router.get('/verificar-socio/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM socio WHERE user_id = $1', [userId]);
    if (result.rows.length > 0) {
      res.status(200).json({ hasSocio: true });
    } else {
      res.status(200).json({ hasSocio: false });
    }
  } catch (error) {
    console.error('Erro ao verificar sócio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


router.post('/adicionar-socio', async (req, res) => {
  const { userId, numSocio, dataNascimento } = req.body;
  try {

    const numSocioInt = parseInt(numSocio);
    const userIdInt = parseInt(userId);
    // Verificar se o número de sócio já existe
    const socioExistente = await pool.query('SELECT * FROM socio WHERE num_socio = $1', [numSocioInt]);
    if (socioExistente.rows.length === 0) {
      res.status(404).json({ error: 'Número de sócio não encontrado' });
    } else if (socioExistente.rows[0].user_id !== null) {
      res.status(400).json({ error: 'Número de sócio já está associado a outro usuário' });
    } else if (socioExistente.rows[0].data_nascimento.toISOString().split('T')[0] !== new Date(dataNascimento).toISOString().split('T')[0]) {
      res.status(400).json({ error: 'Data de nascimento não corresponde ao sócio encontrado' });
    } else {
      // Adicionar o usuário ao sócio existente
      await pool.query('UPDATE socio SET user_id = $1 WHERE num_socio = $2', [userIdInt, numSocioInt]);
      res.status(200).json({ message: 'Usuário adicionado ao sócio com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao adicionar usuário ao sócio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


module.exports = router;