const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Criar um novo bilhete
router.post("/novo", async (req, res) => {
  try {
    const { bilheteira_id, codigo_qr, data_validade, utilizador_id } = req.body;
    const novaBilhete = await pool.query(
      "INSERT INTO bilhete (bilheteira_id, codigo_qr, data_validade, data_compra, utilizador_id) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING *",
      [bilheteira_id, codigo_qr, data_validade, utilizador_id]
    );
    res.json({ bilhete: novaBilhete.rows[0] });
  } catch (err) {
    console.error("Erro ao criar bilhete:", err);
    res.status(500).json({ error: "Erro ao criar bilhete" });
  }
});

router.get("/utilizador/:id/:escalaoId", async (req, res) => {
  try {
    const { id, escalaoId } = req.params;

    // Consulta para obter os bilhetes do utilizador
    const bilhetes = await pool.query("SELECT * FROM bilhete WHERE utilizador_id = $1", [id]);

    // Array para armazenar os bilhetes com o escalão correspondente
    const bilhetesComEscalao = [];

    // Itera sobre os bilhetes para encontrar o escalão correspondente
    for (const bilhete of bilhetes.rows) {
      // Obtém o ID da bilheteira
      const { bilheteira_id } = bilhete;
      
      // Consulta para obter o ID do jogo a partir da bilheteira
      const jogoId = await pool.query("SELECT jogo_id FROM bilheteira WHERE id = $1", [bilheteira_id]);
      
      // Obtém o ID do jogo
      const { jogo_id } = jogoId.rows[0];
      
      // Consulta para obter o escalão a partir do ID do jogo
      const escalao = await pool.query("SELECT escalao_id FROM jogo WHERE id = $1", [jogo_id]);
      
      // Se o escalão corresponder ao escalão desejado, adiciona o bilhete ao array
      if (escalao.rows[0].escalao_id === escalaoId) {
        bilhetesComEscalao.push(bilhete);
      }
    }

    res.json({ bilhetes: bilhetesComEscalao });
  } catch (err) {
    console.error("Erro ao obter bilhetes do utilizador:", err);
    res.status(500).json({ error: "Erro ao obter bilhetes do utilizador" });
  }
});

// Obter todos os bilhetes
router.get("/all", async (req, res) => {
  try {
    const bilhetes = await pool.query("SELECT * FROM bilhete");
    res.json({ bilhete: bilhetes.rows });
  } catch (err) {
    console.error("Erro ao obter bilhetes:", err);
    res.status(500).json({ error: "Erro ao obter bilhetes" });
  }
});

// Obter um único bilhete pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bilhete = await pool.query("SELECT * FROM bilhete WHERE id = $1", [id]);
    if (bilhete.rows.length === 0) {
      return res.status(404).json({ error: "Bilhete não encontrado" });
    }
    res.json({ bilhete: bilhete.rows[0] });
  } catch (err) {
    console.error("Erro ao obter bilhete pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter bilhete pelo ID" });
  }
});

// Atualizar um bilhete
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { bilheteira_id, codigo_qr, data_validade, utilizador_id } = req.body;
    const bilheteAtualizado = await pool.query(
      "UPDATE bilhete SET bilheteira_id = $1, codigo_qr = $2, data_validade = $3, utilizador_id = $4 WHERE id = $5 RETURNING *",
      [bilheteira_id, codigo_qr, data_validade, utilizador_id, id]
    );
    if (bilheteAtualizado.rows.length === 0) {
      return res.status(404).json({ error: "Bilhete não encontrado" });
    }
    res.json({ bilhete: bilheteAtualizado.rows[0] });
  } catch (err) {
    console.error("Erro ao atualizar bilhete:", err);
    res.status(500).json({ error: "Erro ao atualizar bilhete" });
  }
});

// Excluir um bilhete
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bilheteExcluido = await pool.query("DELETE FROM bilhete WHERE id = $1 RETURNING *", [id]);
    if (bilheteExcluido.rows.length === 0) {
      return res.status(404).json({ error: "Bilhete não encontrado" });
    }
    res.json({ message: "Bilhete excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir bilhete:", err);
    res.status(500).json({ error: "Erro ao excluir bilhete" });
  }
});

module.exports = router;