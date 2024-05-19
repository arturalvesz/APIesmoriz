const express = require("express");
const router = express.Router();
const pool = require("../dbConfig"); // Ajuste o caminho conforme necessário
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // Ajuste o caminho

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET_KEY;

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verifique se o usuário já existe no PostgreSQL
    let result = await pool.query("SELECT * FROM utilizador WHERE id = $1", [
      userId,
    ]);
    let user;

    if (result.rows.length === 0) {
      // Se o usuário não existir, crie um novo usuário no PostgreSQL
      const email = decodedToken.email;
      const nome = decodedToken.name || "";
      result = await pool.query(
        "INSERT INTO utilizador (id, nome, email) VALUES ($1, $2, $3) RETURNING *",
        [userId, nome, email]
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erro ao verificar o token:", error);
    return res.sendStatus(403);
  }
}

// Obter ID do usuário a partir do token
router.get("/get-user-id/:token", async (req, res) => {
  const token = req.params.token;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    res.json({ userId });
  } catch (error) {
    console.error("Erro ao verificar o token:", error);
    res.status(400).json({ error: "Token inválido ou expirado" });
  }
});

// Dados do usuário autenticado
router.get("/user-info", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({ authUser: { id: user.id, nome: user.nome, email: user.email } });
  } catch (error) {
    console.error("Erro ao buscar informações do usuário:", error);
    res.status(500).json({ error: "Falha ao buscar informações do usuário" });
  }
});

// Rota protegida
router.get("/protegida", authenticateToken, (req, res) => {
  res.json(req.user);
});

module.exports = router;
