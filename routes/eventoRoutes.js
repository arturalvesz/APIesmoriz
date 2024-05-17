const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo evento
router.post('/novo', async (req, res) => {
  try {
    const { nome, descricao, localizacao, data } = req.body;
    const novoEvento = await pool.query(
      'INSERT INTO Evento (nome, descricao, localizacao, data) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, descricao, localizacao, data]
    );
    res.json(novoEvento.rows[0]);
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// Obter todos os eventos
router.get('/all', async (req, res) => {
  try {
    const todosEventos = await pool.query('SELECT * FROM Evento');
    res.json({eventos : todosEventos.rows });
  } catch (err) {
    console.error('Erro ao obter eventos:', err);
    res.status(500).json({ error: 'Erro ao obter eventos' });
  }
});

// Obter um único evento pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await pool.query('SELECT * FROM Evento WHERE id = $1', [id]);
    if (evento.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(evento.rows[0]);
  } catch (err) {
    console.error('Erro ao obter evento pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter evento pelo ID' });
  }
});

// Atualizar um evento
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, localizacao, data } = req.body;
    const eventoAtualizado = await pool.query(
      'UPDATE Evento SET nome = $1, descricao = $2, localizacao = $3, data = $4 WHERE id = $5 RETURNING *',
      [nome, descricao, localizacao, data, id]
    );
    if (eventoAtualizado.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(eventoAtualizado.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

// Excluir um evento
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventoExcluido = await pool.query('DELETE FROM Evento WHERE id = $1 RETURNING *', [id]);
    if (eventoExcluido.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json({ message: 'Evento excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir evento:', err);
    res.status(500).json({ error: 'Erro ao excluir evento' });
  }
});

module.exports = router;
