const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/create-checkout-session", async (req, res) => {
  const { nome, precoNormal, quantidade, bilheteiraId, dataValidade, utilizadorId } = req.body;

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

router.post("/webhook", asyncHandler(async (req, res) => {
  // Parse the JSON body
  const rawPayload = req.body;

  // Extract the signature from the header
  const sig = req.headers['stripe-signature'];

  // Verify the signature using Stripe secret
  try {
    const verification = await stripe.webhooks.constructEvent(
      rawPayload, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Webhook verification:", verification);

    const session = verification.data.object;

    // Check if the event type is 'checkout.session.completed'
    if (verification.data.type === 'checkout.session.completed') {
      const { id: sessionId, quantidade, bilheteiraId, dataValidade, utilizadorId } = session;

      // Simulate creating tickets (replace with actual database interaction)
     console.log("Simulating ticket creation:", sessionId, quantidade, bilheteiraId, dataValidade, utilizadorId);

      // Send a success response
      res.status(200).send();
    } else {
      // Handle other event types (optional)
      console.log("Unhandled event type:", verification.data.type);
      res.status(200).send(); // You might want to handle other events differently
    }
  } catch (error) {
    console.error("Webhook verification error:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}));


/*router.post("/webhook", async (req, res) => {
  const { sessionId, quantidade, bilheteiraId, dataValidade, utilizadorId } = req.body;
  
setTimeout(async () => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verificar se a sessão existe
    if (session) {
      console.log("Detalhes da sessão:", session);

      // Verificar se o status do pagamento é "paid"
      if (session.payment_status === "paid") {
        console.log("O pagamento foi bem-sucedido.");

        // Criar bilhetes no banco de dados
        try {
          await criarBilhete(bilheteiraId, dataValidade, quantidade, new Date(), utilizadorId);
          console.log("Bilhetes criados com sucesso.");
        } catch (error) {
          console.error("Erro ao criar bilhetes:", error);
          return res.status(500).end();
        }
      } else {
        console.error("O pagamento não foi bem-sucedido. Status:", session.payment_status);
        return res.status(400).end();
      }
    } else {
      console.error("Sessão não encontrada.");
      return res.status(400).end();
    }
  } catch (error) {
    console.error("Erro ao obter detalhes da sessão:", error);
    return res.status(500).end();
  }

  res.status(200).end();
}, 30000);
});*/
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
