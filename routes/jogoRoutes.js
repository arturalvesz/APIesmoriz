const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo jogo
router.post('/novo', async (req, res) => {
  try {
    const { data, nome, escalao_id, resultado } = req.body;
    const novoJogo = await pool.query(
      'INSERT INTO Jogo (data, nome, escalao_id, resultado) VALUES ($1, $2, $3, $4) RETURNING *',
      [data, nome, escalao_id, resultado]
    );
    res.json(novoJogo.rows[0]);
  } catch (err) {
    console.error('Erro ao criar jogo:', err);
    res.status(500).json({ error: 'Erro ao criar jogo' });
  }
});

// Obter todos os jogos
router.get('/all', async (req, res) => {
  try {
    const todosJogos = await pool.query('SELECT * FROM Jogo');
    res.json(todosJogos.rows);
  } catch (err) {
    console.error('Erro ao obter jogos:', err);
    res.status(500).json({ error: 'Erro ao obter jogos' });
  }
});

// Obter um único jogo pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jogo = await pool.query('SELECT * FROM Jogo WHERE id = $1', [id]);
    if (jogo.rows.length === 0) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    res.json(jogo.rows[0]);
  } catch (err) {
    console.error('Erro ao obter jogo pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter jogo pelo ID' });
  }
});

// Atualizar um jogo
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, nome, escalao_id, resultado } = req.body;
    const jogoAtualizado = await pool.query(
      'UPDATE Jogo SET data = $1, nome = $2, escalao_id = $3, resultado = $4 WHERE id = $5 RETURNING *',
      [data, nome, escalao_id, resultado, id]
    );
    if (jogoAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    res.json(jogoAtualizado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar jogo:', err);
    res.status(500).json({ error: 'Erro ao atualizar jogo' });
  }
});

// Excluir um jogo
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jogoExcluido = await pool.query('DELETE FROM Jogo WHERE id = $1 RETURNING *', [id]);
    if (jogoExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    res.json({ message: 'Jogo excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir jogo:', err);
    res.status(500).json({ error: 'Erro ao excluir jogo' });
  }
});

module.exports = router;
