const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require('body-parser');

require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const {precoNormal, quantidade, bilheteiraId, dataValidade, utilizadorId } = req.body;

  try {
    // Crie a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Jogo",
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

     // Envie os dados necessários para o webhook
     const webhookData = {
      quantidade: quantidade,
      bilheteiraId: bilheteiraId,
      dataValidade: dataValidade,
      utilizadorId: utilizadorId
    };

    // Envie os dados para o webhook
    // Substitua a URL do webhook pela URL real do seu webhook
    const webhookUrl = "https://apiesmoriz.onrender.com/api/stripe-webhook/webhook";
    await axios.post(webhookUrl, webhookData);


    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});



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

module.exports = router;
