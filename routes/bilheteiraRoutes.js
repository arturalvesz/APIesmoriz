const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Criar uma nova entrada na bilheteira
router.post("/novo", async (req, res) => {
  try {
    const { nbilhetes, preco_normal, preco_socio, jogo_id } = req.body;
    const novaBilheteira = await pool.query(
      "INSERT INTO bilheteira (nbilhetes, preco_normal, preco_socio, jogo_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [nbilhetes, preco_normal, preco_socio, jogo_id]
    );
    res.json({ bilheteira: novaBilheteira.rows[0] });
  } catch (err) {
    console.error("Erro ao criar bilheteira:", err);
    res.status(500).json({ error: "Erro ao criar bilheteira" });
  }
});


// Obter todos os bilhetes na bilheteira
router.get("/all", async (req, res) => {
  try {
    const bilheteiras = await pool.query("SELECT * FROM bilheteira");
    res.json({ bilheteira: bilheteiras.rows });
  } catch (err) {
    console.error("Erro ao obter bilheteiras:", err);
    res.status(500).json({ error: "Erro ao bilheteiras" });
  }
});

// Obter um único bilhete na bilheteira para um determinado jogo pelo ID do jogo
router.get('/jogo/:jogo_id', async (req, res) => {
    try {
      const { jogo_id } = req.params;
      const bilheteira = await pool.query('SELECT * FROM bilheteira WHERE jogo_id = $1', [jogo_id]);
      if (bilheteira.rows.length === 0) {
        return res.status(404).json({ error: 'Bilhete na bilheteira não encontrado para o jogo especificado' });
      }
      res.json({ bilheteira: bilheteira.rows[0] });
    } catch (err) {
      console.error('Erro ao obter bilheteira para o jogo especificado:', err);
      res.status(500).json({ error: 'Erro ao obter bilheteira para o jogo especificado' });
    }
  });

// Obter um único bilhete na bilheteira pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bilheteira = await pool.query("SELECT * FROM bilheteira WHERE id = $1", [
      id,
    ]);
    if (bilheteira.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bilhete na bilheteira não encontrado" });
    }
    res.json({ bilheteira: bilheteira.rows[0] });
  } catch (err) {
    console.error("Erro ao obter bilheteira pelo ID:", err);
    res
      .status(500)
      .json({ error: "Erro ao obter bilheteira pelo ID" });
  }
});

// Atualizar um bilhete na bilheteira
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nbilhetes, preco_normal, preco_socio, jogo_id } = req.body;
    const bilheteiraAtualizada = await pool.query(
      "UPDATE bilheteira SET nbilhetes = $1, preco_normal = $2, preco_socio = $3, jogo_id = $4 WHERE id = $5 RETURNING *",
      [nbilhetes, preco_normal, preco_socio, jogo_id, id]
    );
    if (bilheteiraAtualizada.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bilhete na bilheteira não encontrado" });
    }
    res.json({ bilheteira: bilheteiraAtualizada.rows[0] });
  } catch (err) {
    console.error("Erro ao atualizar bilhete na bilheteira:", err);
    res.status(500).json({ error: "Erro ao atualizar bilhete na bilheteira" });
  }
});

// Excluir um bilhete na bilheteira
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bilheteiraExcluida = await pool.query(
      "DELETE FROM bilheteira WHERE id = $1 RETURNING *",
      [id]
    );
    if (bilheteiraExcluida.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bilheteira não encontrada" });
    }
    res.json({ message: "Bilheteira excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir bilheteira:", err);
    res.status(500).json({ error: "Erro ao excluir bilheteira" });
  }
});

module.exports = router;
