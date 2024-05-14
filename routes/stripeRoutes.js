const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require('body-parser');

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


router.post("/webhook", async (req, res) => {
  // Exibir o payload recebido
  console.log("Payload recebido:", req.body);

  // Extract the signature from the header
  const sig = req.headers['stripe-signature'];

  // Verificar a assinatura usando a chave secreta do Stripe
  try {
    const event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Evento do webhook:", event);

    // Extraia os dados da sessão do evento
    const session = event.data.object;

    // Verifique se o tipo de evento é 'checkout.session.completed'
    if (event.type === 'checkout.session.completed') {
      const { id: sessionId, quantidade, bilheteiraId, dataValidade, utilizadorId } = session;

      // Simule a criação de ingressos (substitua por uma interação real com o banco de dados)
      console.log("Simulando a criação de ingressos:", sessionId, quantidade, bilheteiraId, dataValidade, utilizadorId);

      // Envie uma resposta de sucesso
      res.status(200).send();
    } else {
      // Lide com outros tipos de evento (opcional)
      console.log("Tipo de evento não tratado:", event.type);
      res.status(200).send(); // Você pode querer lidar com outros eventos de forma diferente
    }
  } catch (error) {
    console.error("Erro de verificação do webhook:", error);
    res.status(400).send(`Erro do Webhook: ${error.message}`);
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
