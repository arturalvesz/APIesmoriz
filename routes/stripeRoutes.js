const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const { nome, precoNormal, quantidade } = req.body;
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
    success_url: 'https://yourwebsite.com/success',
    cancel_url: 'https://yourwebsite.com/cancel',
  });
  res.json({ id: session.id });
});

module.exports = router;
