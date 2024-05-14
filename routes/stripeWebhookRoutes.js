const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../dbConfig");

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/webhook", async (req, res) => {
  
  
  // Extrair a signature do stripe do header
  const sig = req.headers['stripe-signature'];

  // Verificar a assinatura usando a chave secreta do Stripe
  try {
    const event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Evento do webhook:", event);

    const session = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const { quantidade, bilheteiraId, dataValidade, utilizadorId } = session;

       // Chama a função para criar os bilhetes na base de dados
      await criarBilhete(bilheteiraId, dataValidade, quantidade, new Date(), utilizadorId);

      console.log("Bilhetes criados com sucesso.");

      // Envia uma resposta de sucesso
      res.status(200).send();
    } else {
      console.log("Tipo de evento não tratado:", event.type);
      res.status(200).send();
    }
  } catch (error) {
    console.error("Erro de verificação do webhook:", error);
    res.status(400).send(`Erro do Webhook: ${error.message}`);
  }
});

// Função para criar um bilhete
async function criarBilhete(bilheteiraId, dataValidade, quantidade, dataCompra, utilizadorId) {
  try {
    const bilheteiraIdInt = parseInt(bilheteiraId);
    const utilizadorIdInt = parseInt(utilizadorId);

    console.log("Valores recebidos para criar bilhete: \n");
    console.log("Bilheteira ID: \n", bilheteiraIdInt);
    console.log("Data de validade: \n", dataValidade);
    console.log("Quantidade: \n", quantidade);
    console.log("Data de compra: \n", dataCompra);
    console.log("Utilizador ID: \n", utilizadorIdInt);
    
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
