const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo evento
router.post('/novo', async (req, res) => {
  try {
    const { nome, descricao, localizacao, data_inicio, data_fim,hora } = req.body;

    const [diaInicio, mesInicio, anoInicio] = data_inicio.split('-');
    const dataInicio = `${anoInicio}-${mesInicio}-${diaInicio}`;

    const [diaFim, mesFim, anoFim] = data_fim.split('-');
    const dataFim = `${anoFim}-${mesFim}-${diaFim}`;

    const novoEvento = await pool.query(
      'INSERT INTO Evento (nome, descricao, localizacao, data_inicio, data_fim, hora) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nome, descricao, localizacao, dataInicio, dataFim, hora]
    );
    res.json({evento: novoEvento.rows[0]});
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// Obter todos os eventos
router.get("/all", async (req, res) => {
  try {
    const todosEventos = await pool.query(`
      SELECT id, nome, descricao,localizacao, to_char(data_inicio, 'DD-MM-YYYY') as data_inicio,to_char(data_fim, 'DD-MM-YYYY') as data_fim,  to_char(hora, 'HH24:MI') AS hora
      FROM evento
    `);
    res.json({ eventos: todosEventos.rows });
  } catch (err) {
    console.error("Erro ao obter eventos:", err);
    res.status(500).json({ error: "Erro ao obter eventos" });
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
    const { nome, descricao, localizacao, data_inicio, data_fim, hora } = req.body;
    const eventoAtualizado = await pool.query(
      'UPDATE Evento SET nome = $1, descricao = $2, localizacao = $3, data_inicio = $4, data_fim = $5, hora = $6 WHERE id = $5 RETURNING *',
      [nome, descricao, localizacao, data_inicio, data_fim, hora, id]
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
