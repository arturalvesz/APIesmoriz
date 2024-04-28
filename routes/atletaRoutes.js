const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Criar um novo atleta
router.post("/novo", async (req, res) => {
  try {
    const { nome, escalao_id, user_id, num_atleta } = req.body;
    const novoAtleta = await pool.query(
      "INSERT INTO Atleta (nome, escalao_id, user_id, num_atleta) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, escalao_id, user_id, num_atleta]
    );
    res.json(novoAtleta.rows[0]);
  } catch (err) {
    console.error("Erro ao criar atleta:", err);
    res.status(500).json({ error: "Erro ao criar atleta" });
  }
});

// Obter todos os atletas
router.get("/all", async (req, res) => {
  try {
    const todosAtletas = await pool.query("SELECT * FROM Atleta");
    res.json(todosAtletas.rows);
  } catch (err) {
    console.error("Erro ao obter atletas:", err);
    res.status(500).json({ error: "Erro ao obter atletas" });
  }
});

// Obter um único atleta pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const atleta = await pool.query("SELECT * FROM Atleta WHERE id = $1", [id]);
    if (atleta.rows.length === 0) {
      return res.status(404).json({ error: "Atleta não encontrado" });
    }
    res.json(atleta.rows[0]);
  } catch (err) {
    console.error("Erro ao obter atleta pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter atleta pelo ID" });
  }
});

// Atualizar um atleta
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, escalao_id, user_id, num_atleta } = req.body;
    const atletaAtualizado = await pool.query(
      "UPDATE Atleta SET nome = $1, escalao_id = $2, user_id = $3, num_atleta = $4 WHERE id = $5 RETURNING *",
      [nome, escalao_id, user_id, num_atleta, id]
    );
    if (atletaAtualizado.rows.length === 0) {
      return res.status(404).json({ error: "Atleta não encontrado" });
    }
    res.json(atletaAtualizado.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar atleta:", err);
    res.status(500).json({ error: "Erro ao atualizar atleta" });
  }
});

// Excluir um atleta
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const atletaExcluido = await pool.query(
      "DELETE FROM Atleta WHERE id = $1 RETURNING *",
      [id]
    );
    if (atletaExcluido.rows.length === 0) {
      return res.status(404).json({ error: "Atleta não encontrado" });
    }
    res.json({ message: "Atleta excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir atleta:", err);
    res.status(500).json({ error: "Erro ao excluir atleta" });
  }
});

module.exports = router;
