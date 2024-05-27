const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');
const multer = require('multer');
const mime = require('mime');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  limits: { fileSize: 5000000 },
  fileFilter: async (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const originalname = file.originalname.toLowerCase(); 

    if (allowedExtensions.some(ext => originalname.endsWith(ext))) {
      cb(null, true); 
    } else {
      cb(new Error('Only PNG, JPG, and JPEG images are allowed')); 
    }
  },
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const image = req.file;

    if (!image) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const result = await cloudinary.uploader.upload(image.path);

    const imageUrl = result.secure_url;

    const insertQuery = 'INSERT INTO foto (path) VALUES ($1) RETURNING *';
    const values = [imageUrl];

    const client = await pool.connect();
    try {
      const insertResult = await client.query(insertQuery, values);
      const insertedFoto = insertResult.rows[0]; 
      res.json({ message: 'Image uploaded successfully!', uploadedFoto: insertedFoto });
    } finally {
      await client.release(); 
    }
  } catch (err) {
    console.error('Error uploading image or inserting into database:', err);
    res.status(500).json({ error: 'Failed to upload image' });
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
