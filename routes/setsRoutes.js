const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Criar uma nova entrada na tabela sets
router.post("/novo", async (req, res) => {
  try {
    const { jogo_id, numero_set, pontos_casa, pontos_fora } = req.body;

    const novaEntrada = await pool.query(
      "INSERT INTO sets (jogo_id, numero_set, pontos_casa, pontos_fora) VALUES ($1, $2, $3, $4) RETURNING *",
      [jogo_id, numero_set, pontos_casa, pontos_fora]
    );

    // Atualizar os resultados do jogo com base na nova entrada em sets
    await pool.query(
      `
      UPDATE jogo AS j
      SET 
          resultado_casa = resultado_casa + CASE WHEN $3 > $4 THEN 1 ELSE 0 END,
          resultado_fora = resultado_fora + CASE WHEN $4 > $3 THEN 1 ELSE 0 END
      WHERE j.id = $1;
    `,
      [jogo_id, numero_set, pontos_casa, pontos_fora]
    );

    res.json(novaEntrada.rows[0]);
  } catch (err) {
    console.error("Erro ao criar nova entrada:", err);
    res.status(500).json({ error: "Erro ao criar nova entrada" });
  }
});

// Obter todas as entradas na tabela sets
router.get("/all", async (req, res) => {
  try {
    const todasEntradas = await pool.query("SELECT * FROM sets");
    res.json(todasEntradas.rows);
  } catch (err) {
    console.error("Erro ao obter todas as entradas:", err);
    res.status(500).json({ error: "Erro ao obter todas as entradas" });
  }
});

// Obter uma entrada específica na tabela sets pelo ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const entrada = await pool.query("SELECT * FROM sets WHERE id = $1", [id]);
    if (entrada.rows.length === 0) {
      return res.status(404).json({ error: "Entrada não encontrada" });
    }
    res.json(entrada.rows[0]);
  } catch (err) {
    console.error("Erro ao obter entrada pelo ID:", err);
    res.status(500).json({ error: "Erro ao obter entrada pelo ID" });
  }
});

// Atualizar uma entrada específica na tabela sets
router.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { jogo_id, numero_set, pontos_casa, pontos_fora } = req.body;

        const entradaAtualizada = await pool.query(
            "UPDATE sets SET jogo_id = $1, numero_set = $2, pontos_casa = $3, pontos_fora = $4 WHERE id = $5 RETURNING *",
        [jogo_id, numero_set, pontos_casa, pontos_fora, id]
    );

        // Atualizar os resultados do jogo com base na entrada atualizada em sets
        await pool.query(
        `
        UPDATE jogo AS j
        SET 
            resultado_casa = resultado_casa + CASE WHEN $3 > $4 THEN 1 ELSE 0 END,
            resultado_fora = resultado_fora + CASE WHEN $4 > $3 THEN 1 ELSE 0 END
            WHERE j.id = $1;
        `,
        [jogo_id, numero_set, pontos_casa, pontos_fora]
        );

        res.json(entradaAtualizada.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar entrada:", err);
        res.status(500).json({ error: "Erro ao atualizar entrada" });
    }
});

// Excluir uma entrada específica na tabela sets
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const entradaExcluida = await pool.query(
      "DELETE FROM sets WHERE id = $1 RETURNING *",
      [id]
    );
    if (entradaExcluida.rows.length === 0) {
      return res.status(404).json({ error: "Entrada não encontrada" });
    }
    res.json({ message: "Entrada excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir entrada:", err);
    res.status(500).json({ error: "Erro ao excluir entrada" });
  }
});

module.exports = router;
