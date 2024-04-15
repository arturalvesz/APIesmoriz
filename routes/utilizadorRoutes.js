const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo utilizador
router.post('/', async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    const novoUtilizador = await pool.query(
      'INSERT INTO utilizador (nome, email, password) VALUES ($1, $2, $3) RETURNING *',
      [nome, email, password]
    );
    res.json(novoUtilizador.rows[0]);
  } catch (err) {
    console.error('Erro ao criar utilizador:', err);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
}); 

// Obter todos os utilizadores
router.get('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

module.exports = router;
