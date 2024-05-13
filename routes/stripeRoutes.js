const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Função para criar um bilhete no banco de dados
async function criarBilhete(bilheteiraId, dataValidade, quantidade) {
  try {
    const query = "INSERT INTO bilhete (bilheteira_id, data_validade) VALUES ($1, $2) RETURNING id";
    const values = [bilheteiraId, dataValidade];
    const bilheteIds = [];
    for (let i = 0; i < quantidade; i++) {
      const { rows } = await pool.query(query, values);
      bilheteIds.push(rows[0].id);
    }
    return bilheteIds;
  } catch (error) {
    throw error;
  }
}

// Função para criar uma entrada na tabela compra_bilhete
async function criarCompraBilhete(bilheteIds, utilizadorId) {
  try {
    const query = "INSERT INTO compra_bilhete (bilhete_id, utilizador_id) VALUES ($1, $2)";
    const values = bilheteIds.map(bilheteId => [bilheteId, utilizadorId]);
    await Promise.all(values.map(value => pool.query(query, value)));
  } catch (error) {
    throw error;
  }
}

router.post("/create-checkout-session", async (req, res) => {
  const { nome, precoNormal, quantidade, bilheteiraId, utilizadorId, dataValidade } = req.body;

  try {
    // Crie a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: nome,
            },
            unit_amount: precoNormal * 100,
          },
          quantity: quantidade,
        },
      ],
      mode: "payment",
      success_url: "https://www.esmorizgc.pt", // URL de sucesso personalizada
      cancel_url: "https://www.esmorizgc.pt", // URL de cancelamento personalizada
    });
    
    // Criar bilhetes
    const bilheteIds = await criarBilhete(bilheteiraId, dataValidade, quantidade);
    // Criar uma entrada na tabela 'compra_bilhete'
    await criarCompraBilhete(bilheteIds, utilizadorId);

    // Se desejar realizar mais ações, você pode fazer isso aqui antes de responder com o ID e URL da sessão
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});
module.exports = router;
