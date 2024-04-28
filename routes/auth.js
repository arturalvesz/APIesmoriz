const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");

// Expressão regular para validação de senha
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Função para verificar se o usuário está autenticado
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Função para hashear a senha
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Função para comparar a senha hasheada com a senha fornecida pelo usuário
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Criar um novo utilizador e gerar token JWT
router.post("/registo", async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    // Verificar se a senha atende aos critérios da expressão regular
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "A senha não atende aos critérios de segurança" });
    }

    const hashedPassword = await hashPassword(password);

    const novoUtilizador = await pool.query(
      "INSERT INTO utilizador (nome, email, password) VALUES ($1, $2, $3) RETURNING *",
      [nome, email, hashedPassword]
    );

    const user = {
      id: novoUtilizador.rows[0].id,
      nome: novoUtilizador.rows[0].nome,
    };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET_KEY);
    res.json({ accessToken });
  } catch (err) {
    console.error("Erro ao criar utilizador:", err);
    res.status(500).json({ error: "Erro ao criar utilizador" });
  }
});

// Autenticar um utilizador e gerar token JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const utilizador = await pool.query(
      "SELECT * FROM utilizador WHERE email = $1",
      [email]
    );
    if (utilizador.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const hashedPassword = utilizador.rows[0].password;
    const passwordMatch = await comparePassword(password, hashedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = { id: utilizador.rows[0].id, nome: utilizador.rows[0].nome };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET_KEY);
    res.json({ accessToken });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// Rotas protegidas
router.get("/protegida", authenticateToken, (req, res) => {
  res.json(req.user);
});

module.exports = router;
