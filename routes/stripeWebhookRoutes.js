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
    const query = "INSERT INTO bilhete (bilheteira_id, data_validade, data_compra, utilizador_id) VALUES ($1, $2, $3, $4)";
    const values = [bilheteiraIdInt, dataValidade, dataCompra, utilizadorIdInt];
    
    const pdfs = [];

    const { rows: bilheteiraRows } = await pool.query("SELECT equipa_casa, equipa_fora FROM bilheteira WHERE id = $1", [bilheteiraIdInt]);
    const { rows: utilizadorRows } = await pool.query("SELECT email FROM utilizador WHERE id = $1", [utilizadorIdInt]);
    const jogoId = bilheteiraRows[0].jogo_id;

    const { rows: jogoRows } = await pool.query("SELECT equipa_casa, equipa_fora FROM jogo WHERE id = $1", [jogoId]);
    const equipaCasa = jogoRows[0].equipa_casa;
    const equipaFora = jogoRows[0].equipa_fora; 
    const userEmail = utilizadorRows[0].email;
    const nomeJogo = equipaCasa + " vs " + equipaFora;
    
    for (let i = 0; i < quantidade; i++) {
      const { rows } = await pool.query(query, values);
      const bilheteId = rows[0].id;

      const pdfDoc = await generatePDF(nomeJogo,userEmail,bilheteId,dataValidade)

      pdfs.push(pdfDoc);
    }

    await enviarEmail(pdfs, "arturalvesz77@gmail.com");
  } catch (error) {
    throw error;
  }
}



async function enviarEmail(pdfs, userEmail) {
  try {
    // Configurar o transporte de e-mail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'arturalvesz77@gmail.com',
        pass: 'nnnv fyes kglk egyt'
      }
    });

    // Configurar o e-mail
    const mailOptions = {
      from: 'arturalvesz77@gmail.com',
      to: userEmail,
      subject: 'Bilhetes do jogo',
      text: 'Aqui estão os seus bilhetes do jogo',
      attachments: pdfs.map((pdf, index) => ({
        filename: `bilhete_${index + 1}.pdf`,
        content: pdf,
        encoding: 'base64'
      }))
    };

    // Enviar o e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado:', info.response);
  } catch (error) {
    throw error;
  }
}
async function generatePDF(nomeJogo, userEmail, idBilhete, dataJogo) {

  const imageBytes = fs.readFileSync('./public/images/Logo_EGC.png');

  const pdfDoc = await pdfLib.PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 20;
  const textX = 50;
  let textY = height - 50;

  page.drawText(`Jogo: ${nomeJogo}`, {
    x: textX,
    y: textY,
    size: fontSize,
  });
  textY -= 30;
  page.drawText(`Email: ${userEmail}`, {
    x: textX,
    y: textY,
    size: fontSize,
  });
  textY -= 30;
  page.drawText(`ID do Bilhete: ${idBilhete}`, {
    x: textX,
    y: textY,
    size: fontSize,
  });
  textY -= 30;
  page.drawText(`Data do Jogo: ${dataJogo}`, {
    x: textX,
    y: textY,
    size: fontSize,
  });
  textY -= 30;


   // Adicionar a imagem à página PDF
   const image = await pdfDoc.embedPng(imageBytes);
   page.drawImage(image, {
     x: 50,
     y: 50,
     width: 100, // Largura da imagem
     height: 100, // Altura da imagem
   });
  return pdfDoc;
}

module.exports = router;
