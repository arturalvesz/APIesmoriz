const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require("body-parser");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

require("dotenv").config();

router.post("/create-checkout-session", async (req, res) => {
  const { email, utilizadorId, type} = req.body;

  let priceId;
  if(type == 'atleta'){
    priceId = "price_1PLSGWKBAZDUE29JGzJEm3Xw" 
  }
  else{
    priceId = "price_1PGSDrKBAZDUE29JasXKsCos" ;
  }
    try {
    // Encontrar ou criar um cliente no Stripe com base no email
    let customer = await stripe.customers.list({ email: email, limit: 1 });
    if (customer.data.length === 0) {
      // Se o cliente não existir, criar um novo cliente
      customer = await stripe.customers.create({
        email: email,
      });
    } else {
      // Se o cliente já existe, utilizar o primeiro da lista
      customer = customer.data[0];
    }

    // Verificar se o cliente já tem uma assinatura ativa para o produto específico
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      expand: ["data.default_payment_method"],
    });

    const activeSubscription = subscriptions.data.find((subscription) => {
      return subscription.plan.id === priceId;
    });

    if (activeSubscription) {
      return res
        .status(400)
        .json({ error: "Customer already has an active subscription" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "https://apiesmoriz.onrender.com/sucessoSub.html",
      cancel_url: "https://apiesmoriz.onrender.com/cancel.html",

      subscription_data: {
        metadata: {
          utilizadorId: utilizadorId,
          tipoSubscricao: type,
        },
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});


router.post('/cancel-subscription', async (req, res) => {
  const { email } = req.body;

  try {
    // Encontrar o cliente no Stripe pelo email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    const customer = customers.data[0];

    // Encontrar a assinatura ativa do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: "Assinatura ativa não encontrada" });
    }
    const subscription = subscriptions.data[0];

    // Cancelar a assinatura no fim do período atual
    const deletedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });
    
    // Obter utilizadorId a partir dos metadados da subscrição
    const userId = parseInt(subscription.metadata.utilizadorId);

    // Obter a data de expiração atual da subscrição
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];

    // Atualizar o estado na base de dados
    const query = "UPDATE socio SET estado = 'cancelled', data_expiracao_mensalidade = $2 WHERE user_id = $1";
    await pool.query(query, [userId, subscriptionEndDate]);

    // Responder com o resultado da operação
    res.json({ success: true, subscription: deletedSubscription });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    res.status(500).json({ error: "Falha ao cancelar assinatura" });
  }
});




module.exports = router;
