const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo escalão
router.post('/novo', async (req, res) => {
  try {
    const { nome } = req.body;
    const novoEscalao = await pool.query(
      'INSERT INTO Escalao (nome) VALUES ($1) RETURNING *',
      [nome]
    );
    res.json({ escalao: novoEscalao.rows[0] });
  } catch (err) {
    console.error('Erro ao criar escalão:', err);
    res.status(500).json({ error: 'Erro ao criar escalão' });
  }
});

// Obter todos os escalões
router.get('/all', async (req, res) => {
  try {
    const todosEscaloes = await pool.query('SELECT * FROM Escalao');
    res.json({ escalao: todosEscaloes.rows });
  } catch (err) {
    console.error('Erro ao obter escalões:', err);
    res.status(500).json({ error: 'Erro ao obter escalões' });
  }
});

// Obter um único escalão pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const escalao = await pool.query('SELECT * FROM Escalao WHERE id = $1', [id]);
    if (escalao.rows.length === 0) {
      return res.status(404).json({ error: 'Escalão não encontrado' });
    }
    res.json({ escalao: escalao.rows[0] });
  } catch (err) {
    console.error('Erro ao obter escalão pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter escalão pelo ID' });
  }
});

// Atualizar um escalão
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    const escalaoAtualizado = await pool.query(
      'UPDATE Escalao SET nome = $1 WHERE id = $2 RETURNING *',
      [nome, id]
    );
    if (escalaoAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Escalão não encontrado' });
    }
    res.json({ escalao: escalaoAtualizado.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar escalão:', err);
    res.status(500).json({ error: 'Erro ao atualizar escalão' });
  }
});

// Excluir um escalão
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const escalaoExcluido = await pool.query('DELETE FROM Escalao WHERE id = $1 RETURNING *', [id]);
    if (escalaoExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Escalão não encontrado' });
    }
    res.json({ message: 'Escalão excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir escalão:', err);
    res.status(500).json({ error: 'Erro ao excluir escalão' });
  }
});

module.exports = router;