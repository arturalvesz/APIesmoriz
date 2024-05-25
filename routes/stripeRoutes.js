const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
const bodyParser = require('body-parser');
const axios = require('axios');


require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const {precoNormal, precoSocio, quantidade, bilheteiraId, dataValidade, utilizadorId } = req.body;

  let precoJogo = 0;

  const currentDate = new Date().toISOString().split('T')[0]; // Obtém a data atual no formato YYYY-MM-DD

  const query = "SELECT * from socio WHERE user_id = $1 AND ( estado = 'active' OR (estado = 'cancelled' AND data_expiracao_mensalidade > $2))";

  var dataV = dataValidade;
  
  dataV = dataV.split("-").reverse().join("-");


  try {

    const result = await pool.query(query, [utilizadorId, currentDate]);

  if(result.rowCount > 0){
    precoJogo = precoSocio;
  }else{
    precoJogo = precoNormal;
  }
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
            unit_amount: precoJogo * 100,
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
