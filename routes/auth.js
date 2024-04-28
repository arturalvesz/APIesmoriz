const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config(); 

// Expressão regular para validação de senha
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Função para validar a senha
const validatePassword = (password) => {
  return passwordRegex.test(password);
};


// Rota para registro de usuários
router.post('/registo', async (req, res) => {
    const { name, email, password } = req.body;
  
    // Verifica se a senha atende aos critérios
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.' });
    }
  
    try {
      // Verifica se o email já está em uso
      const userWithEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userWithEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email já registrado.' });
      }
  
      // Hash da senha antes de salvar no banco de dados
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insere o novo usuário no banco de dados
      const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, hashedPassword]);
      
      res.status(201).json({ message: 'Usuário registrado com sucesso.', user: newUser.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
  });

// Rota para login de usuários
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Busca o usuário pelo email no banco de dados
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (user.rows.length === 0) {
        return res.status(401).send('Credenciais inválidas.');
      }
  
      const hashedPassword = user.rows[0].password;
  
      // Compara a senha hasheada no banco de dados com a senha fornecida
      const match = await bcrypt.compare(password, hashedPassword);
      if (!match) {
        return res.status(401).send('Credenciais inválidas.');
      }
  
      // Gera um token JWT com o email do usuário
      const token = jwt.sign({ email: user.rows[0].email }, process.env.JWT_SECRET_KEY);
      res.send({ token });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao fazer login.');
    }
  });


module.exports = router;
