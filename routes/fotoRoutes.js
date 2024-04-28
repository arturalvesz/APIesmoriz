const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Criar uma nova foto
router.post('/novo', async (req, res) => {
  try {
    const { path, atleta_id, patrocinador_id } = req.body;
    const novaFoto = await pool.query(
      'INSERT INTO foto (path, atleta_id, patrocinador_id) VALUES ($1, $2, $3) RETURNING *',
      [path, atleta_id || null, patrocinador_id || null]
    );
    res.json(novaFoto.rows[0]);
  } catch (err) {
    console.error('Erro ao criar foto:', err);
    res.status(500).json({ error: 'Erro ao criar foto' });
  }
});

// Obter todas as fotos
router.get('/all', async (req, res) => {
  try {
    const todasFotos = await pool.query('SELECT * FROM foto');
    res.json(todasFotos.rows);
  } catch (err) {
    console.error('Erro ao obter fotos:', err);
    res.status(500).json({ error: 'Erro ao obter fotos' });
  }
});

// Obter uma única foto pelo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query('SELECT * FROM foto WHERE id = $1', [id]);
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    res.json(foto.rows[0]);
  } catch (err) {
    console.error('Erro ao obter foto pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter foto pelo ID' });
  }
});

// Atualizar uma foto
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { path, atleta_id, patrocinador_id } = req.body;
    const fotoAtualizada = await pool.query(
      'UPDATE foto SET path = $1, atleta_id = $2, patrocinador_id = $3 WHERE id = $4 RETURNING *',
      [path, atleta_id || null, patrocinador_id || null, id]
    );
    if (fotoAtualizada.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    res.json(fotoAtualizada.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar foto:', err);
    res.status(500).json({ error: 'Erro ao atualizar foto' });
  }
});

// Excluir uma foto
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fotoExcluida = await pool.query('DELETE FROM foto WHERE id = $1 RETURNING *', [id]);
    if (fotoExcluida.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    res.json({ message: 'Foto excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir foto:', err);
    res.status(500).json({ error: 'Erro ao excluir foto' });
  }
});

module.exports = router;
