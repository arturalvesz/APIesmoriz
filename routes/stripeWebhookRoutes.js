const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../dbConfig");

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware para tratar o corpo da solicitação como raw
router.use(express.raw({ type: "*/*" }));

router.post("/", async (req, res) => {
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
