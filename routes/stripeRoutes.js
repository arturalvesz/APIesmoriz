const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const stripe = require('stripe')('STRIPE_SECRET_KEY');

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
    }); 
    res.redirect(303, session.url);
  }); 

module.exports = router;
