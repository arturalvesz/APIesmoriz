const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../dbConfig");

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/webhook", async (req, res) => {
  // ... (signature verification code)
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Evento do webhook:", event);

    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand: ['line_items', 'subscription'],
    });

    if (event.type === 'checkout.session.completed') {
      // Handle payment and potential subscription creation

      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

        const lineItems = session.line_items.data;
        let quantidadeTotal = 0;
        lineItems.forEach(item => {
          quantidadeTotal += item.quantity;
        });
        const bilheteiraId = paymentIntent.metadata.bilheteiraId;
        const dataValidade = paymentIntent.metadata.dataValidade;
        const utilizadorId = paymentIntent.metadata.utilizadorId;
        await criarBilhete(bilheteiraId, dataValidade, quantidadeTotal, new Date(), utilizadorId);
      }

      if (session.subscription) {
        // Subscription created from checkout session
        const subscription = session.subscription;
        const tipoSubscricao = subscription.metadata.tipoSubscricao;
        if(tipoSubscricao == 'atleta'){
          await handleAtletaSubscriptionCreated(subscription);

        }else{
        await handleSubscriptionCreated(subscription);
        }
      }

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

    // Consulta para criar o bilhete e retornar o ID do bilhete criado
    const query = "INSERT INTO bilhete (bilheteira_id, data_validade, data_compra, utilizador_id) VALUES ($1, $2, $3, $4) RETURNING id";
    const values = [bilheteiraIdInt, dataValidade, dataCompra, utilizadorIdInt];

    // Se necessário, criar múltiplos bilhetes
    for (let i = 0; i < quantidade; i++) {
      // Executa a consulta para criar o bilhete e obter o ID
      const bilheteQuery = await pool.query(query, values);

      // Obtém o ID do bilhete criado
      const bilheteId = bilheteQuery.rows[0].id;

      // Cria o código QR usando informações do bilhete
      const codigoqr = `${bilheteId}${dataValidade}${utilizadorIdInt}`;

      // Atualiza o bilhete com o código QR
      await pool.query(
        "UPDATE bilhete SET codigo_qr = $1 WHERE id = $2",
        [codigoqr, bilheteId]
      );
    }
  } catch (error) {
    throw error;
  }
}


async function handleSubscriptionCreated(subscription) {
  console.log("current_period_start:", subscription.current_period_start);
  console.log("current_period_end:", subscription.current_period_end);

  const status = subscription.status;
  const dataInicio = new Date(subscription.current_period_start * 1000).toLocaleDateString('en-CA');
  const dataExpiracao = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-CA');
  const userId = parseInt(subscription.metadata.utilizadorId);

  try {
    // Verifica se o userId já existe na tabela socio
    const checkUserQuery = "SELECT 1 FROM socio WHERE user_id = $1";
    const checkUserResult = await pool.query(checkUserQuery, [userId]);

    if (checkUserResult.rows.length > 0) {
      // Utilizador já tem numero de sócio, fazer update
      const updateUserQuery = "UPDATE socio SET estado = $1, data_inicio_socio = $2, data_expiracao_mensalidade = $3 WHERE user_id = $4";
      await pool.query(updateUserQuery, [status, dataInicio, dataExpiracao, userId]);
    } else {
      // Utilizador não existe na tabela socio, inserir novo registro
      const insertUserQuery = "INSERT INTO socio (user_id, estado, data_inicio_socio, data_expiracao_mensalidade) VALUES ($1, $2, $3, $4)";
      await pool.query(insertUserQuery, [userId, status, dataInicio, dataExpiracao]);
    }

    console.log("Operação concluída com sucesso.");
  } catch (err) {
    console.error("Erro ao processar a assinatura:", err);
  }
}

async function handleAtletaSubscriptionCreated(subscription) {
  console.log("current_period_start:", subscription.current_period_start);
  console.log("current_period_end:", subscription.current_period_end);

  const status = subscription.status;
  const dataInicio = new Date(subscription.current_period_start * 1000).toLocaleDateString('en-CA');
  const dataExpiracao = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-CA');
  const userId = parseInt(subscription.metadata.utilizadorId);

  try {
    const checkUserQuery = "SELECT 1 FROM atleta WHERE user_id = $1";
    const checkUserResult = await pool.query(checkUserQuery, [userId]);

    if (checkUserResult.rows.length > 0) {
      const updateUserQuery = "UPDATE atleta SET estado = $1, data_inicio_socio = $2, data_expiracao_mensalidade = $3 WHERE user_id = $4";
      await pool.query(updateUserQuery, [status, dataInicio, dataExpiracao, userId]);
    }

    console.log("Operação concluída com sucesso.");
  } catch (err) {
    console.error("Erro ao processar a assinatura:", err);
  }
}

async function handleSubscriptionUpdate(subscription) {
  
  const status = subscription.status;
  const dataExpiracao = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];
  const userId = subscription.metadata.userId;
  //const dataNascimento = subscription.metadata.dataNascimento;

  const query = "UPDATE socio SET estado = $2, data_expiracao_mensalidade = $3 WHERE user_id = $1";
  await pool.query(query, [userId, status, dataExpiracao]);
}

module.exports = router;
