const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Criar um novo bilhete na bilheteira
router.post("/novo", async (req, res) => {
  try {
    const { nbilhetes, preco_normal, preco_socio, jogo_id } = req.body;
    const novoBilhete = await pool.query(
      "INSERT INTO bilheteira (nbilhetes, preco_normal, preco_socio, jogo_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [nbilhetes, preco_normal, preco_socio, jogo_id]
    );
    res.json({ bilhete: novoBilhete.rows[0] });
  } catch (err) {
    console.error("Erro ao criar bilhete na bilheteira:", err);
    res.status(500).json({ error: "Erro ao criar bilhete na bilheteira" });
  }
});


// Obter todos os bilhetes na bilheteira
router.get("/all", async (req, res) => {
  try {
    const todosBilhetes = await pool.query("SELECT * FROM bilheteira");
    res.json({ bilhetes: todosBilhetes.rows });
  } catch (err) {
    console.error("Erro ao obter bilhetes da bilheteira:", err);
    res.status(500).json({ error: "Erro ao obter bilhetes da bilheteira" });
  }
});

// Obter um único bilhete na bilheteira para um determinado jogo pelo ID do jogo
router.get('/jogo/:jogo_id', async (req, res) => {
    try {
      const { jogo_id } = req.params;
      const bilhete = await pool.query('SELECT * FROM bilheteira WHERE jogo_id = $1', [jogo_id]);
      if (bilhete.rows.length === 0) {
        return res.status(404).json({ error: 'Bilhete na bilheteira não encontrado para o jogo especificado' });
      }
      res.json({ bilhete: bilhete.rows[0] });
    } catch (err) {
      console.error('Erro ao obter bilhete na bilheteira para o jogo especificado:', err);
      res.status(500).json({ error: 'Erro ao obter bilhete na bilheteira para o jogo especificado' });
    }
  });

// Obter um único bilhete na bilheteira pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bilhete = await pool.query("SELECT * FROM bilheteira WHERE id = $1", [
      id,
    ]);
    if (bilhete.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bilhete na bilheteira não encontrado" });
    }
    res.json({ bilhete: bilhete.rows[0] });
  } catch (err) {
    console.error("Erro ao obter bilhete na bilheteira pelo ID:", err);
    res
      .status(500)
      .json({ error: "Erro ao obter bilhete na bilheteira pelo ID" });
  }
});

// Atualizar um bilhete na bilheteira
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nbilhetes, preco_normal, preco_socio, jogo_id } = req.body;
    const bilheteAtualizado = await pool.query(
      "UPDATE bilheteira SET nbilhetes = $1, preco_normal = $2, preco_socio = $3, jogo_id = $4 WHERE id = $5 RETURNING *",
      [nbilhetes, preco_normal, preco_socio, jogo_id, id]
    );
    if (bilheteAtualizado.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bilhete na bilheteira não encontrado" });
    }
    res.json({ bilhete: bilheteAtualizado.rows[0] });
  } catch (err) {
    console.error("Erro ao atualizar bilhete na bilheteira:", err);
    res.status(500).json({ error: "Erro ao atualizar bilhete na bilheteira" });
  }
});

// Excluir um bilhete na bilheteira
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bilheteExcluido = await pool.query(
      "DELETE FROM bilheteira WHERE id = $1 RETURNING *",
      [id]
    );
    if (bilheteExcluido.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bilhete na bilheteira não encontrado" });
    }
    res.json({ message: "Bilhete na bilheteira excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir bilhete na bilheteira:", err);
    res.status(500).json({ error: "Erro ao excluir bilhete na bilheteira" });
  }
});

module.exports = router;
