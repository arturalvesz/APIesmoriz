const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Rota para criar um pagamento
router.post("/pagamento", async (req, res) => {
  try {
    // Recupera os dados do bilheteira enviados pelo cliente
    const { quantidade ,nbilhetes, jogo_id, preco_normal, preco_socio, token } = req.body;

    // Verifica se os dados do bilheteira foram recebidos
    if (!nbilhetes || !jogo_id || !token) {
      return res.status(400).json({ error: "Dados do bilheteira incompletos" });
    }

    // Calcula o montante total do pagamento com base no número de bilhetes e nos preços
    const amount = quantidade * preco_normal;

    // Cria uma cobrança usando o token
    const charge = await stripe.charges.create({
      amount: amount * 100, // Montante em centavos
      currency: "eur", // Moeda (pode ser 'usd', 'eur', etc.)
      description: `Compra de bilhetes para o jogo ID ${jogo_id}`,
      source: token, // Token de pagamento gerado pelo Stripe.js
    });

    // Se a cobrança for bem-sucedida, insere os dados do bilheteira no banco de dados
    if (charge) {
      const queryText =
        "INSERT INTO bilhete (bilheteira_id) VALUES ($1)";
      await pool.query(queryText, [
        bilheteira_id
      ]);
    }

    // Envie uma resposta de sucesso
    res
      .status(200)
      .json({ message: "Pagamento processado com sucesso", charge });
  } catch (error) {
    // Se ocorrer um erro, envia uma resposta de erro
    console.error("Erro ao processar o pagamento:", error);
    res.status(500).json({ error: "Erro ao processar o pagamento" });
  }
});


module.exports = router;
