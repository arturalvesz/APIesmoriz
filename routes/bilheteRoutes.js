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

    // Consulta para obter os bilhetes do utilizador, formatando as datas conforme necessário
    const bilhetesResult = await pool.query(`
      SELECT
        id,
        bilheteira_id,
        TO_CHAR(data_compra, 'DD-MM-YYYY') AS data_compra,
        TO_CHAR(data_validade, 'DD-MM-YYYY') AS data_validade,
        utilizador_id,
        validado
      FROM bilhete
      WHERE utilizador_id = $1
    `, [id]);
    const bilhetes = bilhetesResult.rows;

    // Array para armazenar os bilhetes com o escalão correspondente
    const bilhetesComEscalao = [];

    // Itera sobre os bilhetes para encontrar os bilhetes do escalão correspondente
    for (const bilhete of bilhetes) {
      // Obtém o ID da bilheteira do bilhete
      const bilheteiraId = bilhete.bilheteira_id;

      // Consulta para obter o ID do jogo a partir da bilheteira
      const jogoIdResult = await pool.query("SELECT jogo_id FROM bilheteira WHERE id = $1", [bilheteiraId]);
      const jogoId = jogoIdResult.rows[0].jogo_id;

      // Consulta para obter o jogo (incluindo equipa_casa e equipa_fora) a partir do ID do jogo
      const jogoResult = await pool.query("SELECT equipa_casa, equipa_fora FROM jogo WHERE id = $1", [jogoId]);
      const jogo = jogoResult.rows[0];

      // Consulta para obter o escalão a partir do ID do jogo
      const escalaoResult = await pool.query("SELECT escalao_id FROM jogo WHERE id = $1", [jogoId]);
      const jogoEscalaoId = escalaoResult.rows[0].escalao_id;

      // Se o escalão do jogo corresponder ao escalão desejado, adiciona o bilhete ao array
      if (jogoEscalaoId === parseInt(escalaoId)) {
        bilhete.equipa_casa = jogo.equipa_casa;
        bilhete.equipa_fora = jogo.equipa_fora;
        bilhetesComEscalao.push(bilhete);
      }
    }

    res.json({ bilhetes: bilhetesComEscalao });
  } catch (err) {
    console.error("Erro ao obter bilhetes do utilizador:", err);
    res.status(500).json({ error: "Erro ao obter bilhetes do utilizador" });
  }
});


//Mostrar bilhetes comprados pelo utilizador nos ultimos 30 minutos
router.get("/utilizador/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Consulta para obter os bilhetes do utilizador criados nos últimos 30 minutos
    const bilhetesResult = await pool.query(`
      SELECT
        b.id,
        b.bilheteira_id,
        TO_CHAR(b.data_compra, 'DD-MM-YYYY') AS data_compra,
        TO_CHAR(b.data_validade, 'DD-MM-YYYY') AS data_validade,
        b.utilizador_id,
        b.validado,
        j.equipa_casa,
        j.equipa_fora
      FROM bilhete b
      JOIN bilheteira bi ON b.bilheteira_id = bi.id
      JOIN jogo j ON bi.jogo_id = j.id
      WHERE b.utilizador_id = $1
        AND b.data_compra >= NOW() - INTERVAL '30 minutes'
    `, [id]);


    const bilhetes = bilhetesResult.rows;

    res.json({ bilhetesRecentes: bilhetes });
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