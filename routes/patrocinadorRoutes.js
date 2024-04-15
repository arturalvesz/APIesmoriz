const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo patrocinador
router.post('/', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const novoPatrocinador = await pool.query(
      'INSERT INTO Patrocinador (nome, descricao) VALUES ($1, $2) RETURNING *',
      [nome, descricao]
    );
    res.json(novoPatrocinador.rows[0]);
  } catch (err) {
    console.error('Erro ao criar patrocinador:', err);
    res.status(500).json({ error: 'Erro ao criar patrocinador' });
  }
});

// Obter todos os patrocinadores
router.get('/', async (req, res) => {
  try {
    const todosPatrocinadores = await pool.query('SELECT * FROM Patrocinador');
    res.json(todosPatrocinadores.rows);
  } catch (err) {
    console.error('Erro ao obter patrocinadores:', err);
    res.status(500).json({ error: 'Erro ao obter patrocinadores' });
  }
});

// Obter um único patrocinador pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patrocinador = await pool.query('SELECT * FROM Patrocinador WHERE id = $1', [id]);
    if (patrocinador.rows.length === 0) {
      return res.status(404).json({ error: 'Patrocinador não encontrado' });
    }
    res.json(patrocinador.rows[0]);
  } catch (err) {
    console.error('Erro ao obter patrocinador pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter patrocinador pelo ID' });
  }
});

// Atualizar um patrocinador
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    const patrocinadorAtualizado = await pool.query(
      'UPDATE Patrocinador SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *',
      [nome, descricao, id]
    );
    if (patrocinadorAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Patrocinador não encontrado' });
    }
    res.json(patrocinadorAtualizado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar patrocinador:', err);
    res.status(500).json({ error: 'Erro ao atualizar patrocinador' });
  }
});

// Excluir um patrocinador
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patrocinadorExcluido = await pool.query('DELETE FROM Patrocinador WHERE id = $1 RETURNING *', [id]);
    if (patrocinadorExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Patrocinador não encontrado' });
    }
    res.json({ message: 'Patrocinador excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir patrocinador:', err);
    res.status(500).json({ error: 'Erro ao excluir patrocinador' });
  }
});

module.exports = router;
