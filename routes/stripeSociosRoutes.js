const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require("body-parser");
const axios = require("axios");

require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const { email, priceId, utilizadorId } = req.body;

  try {
    // Verificar se o cliente já tem uma assinatura ativa para o produto específico
    const subscriptions = await stripe.subscriptions.list({
      customer_email: email, // Filtrar assinaturas pelo email do cliente
      status: "active", // Apenas assinaturas ativas
      expand: ["data.default_payment_method"], // Inclui informações adicionais
    });

    const activeSubscription = subscriptions.data.find((subscription) => {
      return subscription.plan.id === priceId; // Verifica se o ID do plano corresponde ao ID do preço
    });

    if (activeSubscription) {
      // Cliente já tem uma assinatura ativa para o produto específico
      return res
        .status(400)
        .json({ error: "Customer already has an active subscription" });
    }

    // Se o cliente não tiver uma assinatura ativa, criar uma nova sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
