const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

const cloudinary = require('cloudinary').v2;
          
cloudinary.config({ 
  cloud_name: 'dsy8o6tn7', 
  api_key: '519515781627635', 
  api_secret: 'Wlbjy2udigy1NfjLwX__SRPY2pc' 
});

// Criar uma nova foto
router.post('/novo', async (req, res) => {
  try {
    // Check if a file is uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'Nenhuma foto enviada' });
    }

    // Get the uploaded file from the request
    const { file } = req.files;

    // Upload the file to Cloudinary
    const uploadedPhoto = await cloudinary.uploader.upload(file.tempFilePath);

    // Extract the photo URL from the Cloudinary response
    const { secure_url: photoUrl, public_id: cloudinaryId } = uploadedPhoto;

    // Store the photo URL and associated data in the database
    const { evento_id, noticia_id, patrocinador_id } = req.body;
    const novaFoto = await pool.query(
      'INSERT INTO foto (path, evento_id, noticia_id, patrocinador_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [photoUrl, evento_id || null, noticia_id || null, patrocinador_id || null]
    );

    // Return the newly created photo
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

// Obter uma única foto pelo ID
router.get('/patrocinador/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query('SELECT path FROM foto WHERE patrocinador_id = $1', [id]);
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    const filename = foto.rows[0].path; 
    res.json({ patrocinadorPath: filename });
  } catch (err) {
    console.error('Erro ao obter foto pelo ID:', err);
    res.status(500).json({ error: 'Erro ao obter foto pelo ID' });
  }
});

// Atualizar uma foto
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { path,patrocinador_id } = req.body;
    const fotoAtualizada = await pool.query(
      'UPDATE foto SET path = $1, patrocinador_id = $2 WHERE id = $3 RETURNING *',
      [path, patrocinador_id || null, id]
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
