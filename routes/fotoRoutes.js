const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/uploadImage", upload.single("image-file"), async function (req, res, next) {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);

    const { patrocinador_id, evento_id, socio_id, noticia_id, atleta_id } = req.body;
    const filePath = result.secure_url;

    let column, value;

    if (patrocinador_id !== undefined && patrocinador_id !== "null") {
      column = "patrocinador_id";
      value = parseInt(patrocinador_id);
    } else if (evento_id !== undefined && evento_id !== "null") {
      column = "evento_id";
      value = parseInt(evento_id);
    } else if (socio_id !== undefined && socio_id !== "null") {
      column = "socio_id";
      value = parseInt(socio_id);
    } else if (atleta_id !== undefined && atleta_id !== "null") {
      column = "atleta_id";
      value = parseInt(atleta_id);
    } else if (noticia_id !== undefined && noticia_id !== "null") {
      column = "noticia_id";
      value = parseInt(noticia_id);
    } else {
      return res.status(400).json({ message: "Invalid request. Please provide valid parameters." });
    }

    // Verifique se já existe um registro com o mesmo ID
    const checkQuery = `
      SELECT * FROM foto WHERE ${column} = $1;
    `;
    const checkResult = await pool.query(checkQuery, [value]);

    if (checkResult.rows.length > 0) {
      // Se existir, atualize o path
      const updateQuery = `
        UPDATE foto
        SET path = $1
        WHERE ${column} = $2
        RETURNING *;
      `;
      const updateResult = await pool.query(updateQuery, [filePath, value]);
      return res.json({
        message: "Record updated successfully",
        imageUrl: filePath,
        databaseRecord: updateResult.rows[0],
      });
    } else {
      // Se não existir, insira um novo registro
      const insertQuery = `
        INSERT INTO foto (${column}, path)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const insertResult = await pool.query(insertQuery, [value, filePath]);
      return res.json({
        message: "Record inserted successfully",
        imageUrl: filePath,
        databaseRecord: insertResult.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Upload failed" });
  }
});

// Obter todas as fotos
router.get("/all", async (req, res) => {
  try {
    const todasFotos = await pool.query("SELECT * FROM foto");
    res.json(todasFotos.rows);
  } catch (err) {
    console.error("Erro ao obter fotos:", err);
    res.status(500).json({ error: "Erro ao obter fotos" });
  }
});

// Obter uma única foto pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query("SELECT * FROM foto WHERE id = $1", [id]);
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    res.json(foto.rows[0]);
  } catch (err) {
    console.error("Erro ao obter foto pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter foto pelo ID" });
  }
});

// Obter uma única foto pelo ID
router.get("/patrocinador/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query(
      "SELECT path FROM foto WHERE patrocinador_id = $1",
      [id]
    );
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const filename = foto.rows[0].path;
    res.json({ patrocinadorImagePath: filename });
  } catch (err) {
    console.error("Erro ao obter foto pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter foto pelo ID" });
  }
});
router.get("/noticia/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query(
      "SELECT path FROM foto WHERE noticia_id = $1",
      [id]
    );
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const filename = foto.rows[0].path;
    res.json({ noticiaImagePath: filename });
  } catch (err) {
    console.error("Erro ao obter foto pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter foto pelo ID" });
  }
});
router.get("/evento/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query(
      "SELECT path FROM foto WHERE evento_id = $1",
      [id]
    );
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const filename = foto.rows[0].path;
    res.json({ eventoImagePath: filename });
  } catch (err) {
    console.error("Erro ao obter foto pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter foto pelo ID" });
  }
});

router.get("/socio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query(
      "SELECT path FROM foto WHERE socio_id = $1",
      [id]
    );
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const filename = foto.rows[0].path;
    res.json({ socioFotoPath: filename });
  } catch (err) {
    console.error("Erro ao obter foto pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter foto pelo ID" });
  }
});

router.get("/atleta/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await pool.query(
      "SELECT path FROM foto WHERE atleta_id = $1",
      [id]
    );
    if (foto.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const filename = foto.rows[0].path;
    res.json({ atletaFotoPath: filename });
  } catch (err) {
    console.error("Erro ao obter foto pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter foto pelo ID" });
  }
});

// Atualizar uma foto
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { path, patrocinador_id } = req.body;
    const fotoAtualizada = await pool.query(
      "UPDATE foto SET path = $1, patrocinador_id = $2 WHERE id = $3 RETURNING *",
      [path, patrocinador_id || null, id]
    );
    if (fotoAtualizada.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    res.json(fotoAtualizada.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar foto:", err);
    res.status(500).json({ error: "Erro ao atualizar foto" });
  }
});

// Excluir uma foto
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fotoExcluida = await pool.query(
      "DELETE FROM foto WHERE id = $1 RETURNING *",
      [id]
    );
    if (fotoExcluida.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    res.json({ message: "Foto excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir foto:", err);
    res.status(500).json({ error: "Erro ao excluir foto" });
  }
});

module.exports = router;
