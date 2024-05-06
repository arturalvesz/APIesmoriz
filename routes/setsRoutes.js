const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Criar uma nova entrada na tabela sets
async function atualizarResultadosJogo(jogoId) {
  try {
    // Faz a lógica de atualização dos resultados aqui
    const resultadoSets = await pool.query(
      "SELECT pontos_casa, pontos_fora FROM sets WHERE jogo_id = $1",
      [jogoId]
    );

    let resultadoCasa = 0;
    let resultadoFora = 0;

    resultadoSets.rows.forEach(({ pontos_casa, pontos_fora }) => {
      if (pontos_casa > pontos_fora) {
        resultadoCasa++;
      } else if (pontos_fora > pontos_casa) {
        resultadoFora++;
      }
    });

    // Atualiza os resultados na tabela jogo
    await pool.query(
      "UPDATE jogo SET resultado_casa = $1, resultado_fora = $2 WHERE id = $3",
      [resultadoCasa, resultadoFora, jogoId]
    );

    console.log("Resultados do jogo atualizados com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar os resultados do jogo:", error);
  }
}

// Rota para adicionar um novo conjunto de pontuações
router.post("/novo", async (req, res) => {
    try {
      const { jogo_id, numero_set, pontos_casa, pontos_fora } = req.body;
  
      // Verifica se já existe um conjunto de pontuações com o mesmo numero_set para o mesmo jogo_id
      const existemConjuntos = await pool.query(
        "SELECT COUNT(*) FROM sets WHERE jogo_id = $1 AND numero_set = $2",
        [jogo_id, numero_set]
      );
  
      if (existemConjuntos.rows[0].count > 0) {
        return res.status(400).json({ error: "Este set já tem pontuações" });
      }
  
      // Insere o novo conjunto de pontuações na tabela sets
      const novaEntrada = await pool.query(
        "INSERT INTO sets (jogo_id, numero_set, pontos_casa, pontos_fora) VALUES ($1, $2, $3, $4) RETURNING *",
        [jogo_id, numero_set, pontos_casa, pontos_fora]
      );
  
      // Atualiza os resultados do jogo
      await atualizarResultadosJogo(jogo_id);
  
      res.json(novaEntrada.rows[0]);
    } catch (err) {
      console.error("Erro ao criar nova entrada:", err);
      res.status(500).json({ error: "Erro ao criar nova entrada" });
    }
  });

router.get("/jogo/:jogo_id", async (req, res) => {
  try {
    const { jogo_id } = req.params;
    const setsJogo = await pool.query("SELECT * FROM sets WHERE jogo_id = $1", [
      jogo_id,
    ]);
    res.json(setsJogo.rows);
  } catch (err) {
    console.error("Erro ao obter sets do jogo:", err);
    res.status(500).json({ error: "Erro ao obter sets do jogo" });
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

// Rota para atualizar um conjunto de pontuações existente
router.put("/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { jogo_id, numero_set, pontos_casa, pontos_fora } = req.body;
  
      // Verifica se já existe um conjunto de pontuações com o mesmo numero_set para o mesmo jogo_id, excluindo o conjunto que está sendo atualizado
      const existemConjuntos = await pool.query(
        "SELECT COUNT(*) FROM sets WHERE jogo_id = $1 AND numero_set = $2 AND id != $3",
        [jogo_id, numero_set, id]
      );
  
      if (existemConjuntos.rows[0].count > 0) {
        return res.status(400).json({ error: "Este set já tem pontuações" });
      }
  
      // Atualiza o conjunto de pontuações na tabela sets
      const entradaAtualizada = await pool.query(
        "UPDATE sets SET jogo_id = $1, numero_set = $2, pontos_casa = $3, pontos_fora = $4 WHERE id = $5 RETURNING *",
        [jogo_id, numero_set, pontos_casa, pontos_fora, id]
      );
  
      // Atualiza os resultados do jogo
      await atualizarResultadosJogo(jogo_id);
  
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
