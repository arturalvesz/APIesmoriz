const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../dbConfig");
const pdfLib = require('pdf-lib');
const nodemailer = require('nodemailer');
const fs = require('fs');

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

    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand: ['line_items'],
    });

    const paymentIntentId = event.data.object.payment_intent;

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    if (event.type === 'checkout.session.completed') {
      const lineItems = session.line_items.data;
      // Inicializa a quantidade total como 0
      let quantidadeTotal = 0;
      // Itera sobre os itens da linha para calcular a quantidade total
      lineItems.forEach(item => {
        quantidadeTotal += item.quantity;
      });
      const bilheteiraId = paymentIntent.metadata.bilheteiraId;
      const dataValidade = paymentIntent.metadata.dataValidade;
      const utilizadorId = paymentIntent.metadata.utilizadorId;
      // Chama a função para criar os bilhetes na base de dados
      await criarBilhete(bilheteiraId, dataValidade, quantidadeTotal, new Date(), utilizadorId);

      res.status(200).send();

    } else if (event.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(event.data.object);
      res.status(200).send();
    } else if (event.type === 'customer.subscription.updated') {
      //await handleSubscriptionUpdated(event.data.object);
      res.status(200).send();
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object);
      //res.status(200).send();
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
    const query = "INSERT INTO bilhete (bilheteira_id, data_validade, data_compra, utilizador_id) VALUES ($1, $2, $3, $4) RETURNING id";
    const values = [bilheteiraIdInt, dataValidade, dataCompra, utilizadorIdInt];
    for (let i = 0; i < quantidade; i++) {
      await pool.query(query, values);
    }
  } catch (error) {
    throw error;
  }
}

async function handleSubscriptionCreated(subscription) {
  
  const status = subscription.status;
  const dataInicio = new Date(subscription.current_period_start * 1000);
  const dataExpiracao = new Date(subscription.current_period_end * 1000);
  const userId = subscription.metadata.userId;
  const dataNascimento = subscription.metadata.dataNascimento;

  const query = `
    INSERT INTO socio (user_id, status, data_inicio_socio, data_expiracao_mensalidade, data_nascimento)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id) DO UPDATE 
    SET status = $2, data_inicio_socio = $3, data_expiracao_mensalidade = $4, data_nascimento = $5;
  `;
  await pool.query(query, [userId, status, dataInicio, dataExpiracao, dataNascimento]);
}

module.exports = router;
