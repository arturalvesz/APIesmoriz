const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar um novo sócio
router.post('/', async (req, res) => {
  try {
    const { num_socio, user_id } = req.body;
    const novoSocio = await pool.query(
      'INSERT INTO Socio (num_socio, user_id) VALUES ($1, $2) RETURNING *',
      [num_socio, user_id]
    );
    res.json(novoSocio.rows[0]);
  } catch (err) {
    console.error('Erro ao criar sócio:', err);
    res.status(500).json({ error: 'Erro ao criar sócio' });
  }
});

// Obter todos os sócios
router.get('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

module.exports = router;
