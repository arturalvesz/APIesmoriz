const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require('body-parser');
const axios = require('axios');


require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const {precoNormal, quantidade, bilheteiraId, dataValidade, utilizadorId } = req.body;

  var dataV = dataValidade;
  
  dataV = dataV.split("-").reverse().join("-");


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
      success_url: "https://esmorizgc.pt",
      cancel_url: "https://esmorizgc.pt", 

      payment_intent_data: {
        metadata: {
          bilheteiraId: bilheteiraId,
          dataValidade: dataV,
          utilizadorId: utilizadorId,
        },
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});


module.exports = router;
