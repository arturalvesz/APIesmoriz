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
    success_url: "https://www.esmorizgc.pt/",
    cancel_url: "https://www.esmorizgc.pt/",
  });
  res.json({ id: session.id, url: session.url });
});

router.post("/handle-payment", async (req, res) => {
  const { sessionId } = req.body;

  await new Promise(resolve => setTimeout(resolve, 2000)); // 2000 milliseconds = 2 seconds


  try {
    // Retrieve the session to check the payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentStatus = session.payment_status;


    
    // Assuming you have some logic to determine the payment status
    if (paymentStatus === "paid") {
      // Payment was successful
      res.json({ success: true, message: "Payment successful" });
    } else {
      // Payment status is not "paid", return null
      res.json({ success: null, message: "Payment status not determined" });
    }
  } catch (error) {
    console.error("Error handling payment:", error);
    res.status(500).json({ error: "Failed to handle payment" });
  }
});


module.exports = router;
