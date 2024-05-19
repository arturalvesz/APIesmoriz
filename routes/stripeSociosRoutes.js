const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require("body-parser");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

require("dotenv").config();

router.post("/create-checkout-session", async (req, res) => {
  const { email, priceId, utilizadorId } = req.body;

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
      success_url: "https://esmorizgc.pt",
      cancel_url: "https://esmorizgc.pt",

      subscription_data: {
        metadata: {
          utilizadorId: utilizadorId,
        },
        billing_cycle_anchor: Math.round((new Date().setMonth(new Date().getMonth() + 1)) / 1000),

      },
    });

    // Responder com o ID e URL da sessão de checkout
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});

module.exports = router;
