const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');




// Criar uma nova notícia
router.post("/novo", async (req, res) => {
    try {
      const { titulo, descricao } = req.body;
      const data = new Date().toISOString().split('T')[0]; // Obtém a data atual sem as horas
      const novaNoticia = await pool.query(
        "INSERT INTO noticia (titulo, descricao, data) VALUES ($1, $2, $3) RETURNING *",
        [titulo, descricao, data]
      );
      res.json({ noticia: novaNoticia.rows[0] });
    } catch (err) {
      console.error("Erro ao criar notícia:", err);
      res.status(500).json({ error: "Erro ao criar notícia" });
    }
  });

// Obter todas as notícias
router.get("/all", async (req, res) => {
  try {
    const todasNoticias = await pool.query("SELECT * FROM noticia");
    res.json({ noticia: todasNoticias.rows });
  } catch (err) {
    console.error("Erro ao obter notícias:", err);
    res.status(500).json({ error: "Erro ao obter notícias" });
  }
});

// Obter uma única notícia pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const noticia = await pool.query("SELECT * FROM noticia WHERE id = $1", [
      id,
    ]);
    if (noticia.rows.length === 0) {
      return res.status(404).json({ error: "Notícia não encontrada" });
    }
    res.json({ noticia: noticia.rows[0] });
  } catch (err) {
    console.error("Erro ao obter notícia pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter notícia pelo ID" });
  }
});

// Atualizar uma notícia
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, data } = req.body;
    const noticiaAtualizada = await pool.query(
      "UPDATE noticia SET titulo = $1, descricao = $2, data = $3 WHERE id = $4 RETURNING *",
      [titulo, descricao, data, id]
    );
    if (noticiaAtualizada.rows.length === 0) {
      return res.status(404).json({ error: "Notícia não encontrada" });
    }
    res.json({ noticia: noticiaAtualizada.rows[0] });
  } catch (err) {
    console.error("Erro ao atualizar notícia:", err);
    res.status(500).json({ error: "Erro ao atualizar notícia" });
  }
});

// Excluir uma notícia
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const noticiaExcluida = await pool.query(
      "DELETE FROM noticia WHERE id = $1 RETURNING *",
      [id]
    );
    if (noticiaExcluida.rows.length === 0) {
      return res.status(404).json({ error: "Notícia não encontrada" });
    }
    res.json({ message: "Notícia excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir notícia:", err);
    res.status(500).json({ error: "Erro ao excluir notícia" });
  }
});

module.exports = router;
