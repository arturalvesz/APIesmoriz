const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


router.post("/create-checkout-session", async (req, res) => {
  const { nome, precoNormal, quantidade, bilheteiraId, dataValidade, utilizadorId } = req.body;
  const dataCompra = new Date(); // Obtém a data atual

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

    // Se desejar realizar mais ações, você pode fazer isso aqui antes de responder com o ID e URL da sessão
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});


// Webhook endpoint para receber eventos do Stripe
router.post("/webhook", async (req, res) => {
  let event;
  try {
    event = req.body;
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Verificar se o evento é de pagamento bem-sucedido
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Obter detalhes do bilhete a partir dos metadados do Stripe
    const { bilheteiraId, dataValidade, quantidade, utilizadorId } = session.metadata;

    // Criar bilhetes no banco de dados
    try {
      await criarBilhete(bilheteiraId, dataValidade, quantidade, new Date(), utilizadorId);
    } catch (error) {
      console.error("Erro ao criar bilhetes:", error);
      return res.status(500).end();
    }
  }

  res.status(200).end();
});

// Função para criar um bilhete no banco de dados
async function criarBilhete(bilheteiraId, dataValidade, quantidade, dataCompra, utilizadorId) {
  
  
  try {
    
    const bilheteiraIdInt = parseInt(bilheteiraId);
    const utilizadorIdInt = parseInt(utilizadorId);
    
    const query = "INSERT INTO bilhete (bilheteira_id, data_validade, data_compra, utilizador_id) VALUES ($1, $2, $3, $4)";
    const values = [bilheteiraIdInt, dataValidade, dataCompra, utilizadorIdInt];
    for (let i = 0; i < quantidade; i++) {
      await pool.query(query, values);
    }
  } catch (error) {
    throw error;
  }
}


module.exports = router;
