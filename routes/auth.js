const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config(); 
const JWT_SECRET = process.env.JWT_SECRET_KEY;


// Expressão regular para validação de senha
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Middleware para verificar token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Rota para registro de usuário
app.post('/registo', async (req, res) => {
    const { name, email, password } = req.body;
    if (!passwordRegex.test(password)) {
        return res.status(400).send('Password must meet complexity requirements');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id', [name, email, hashedPassword]);
        const userId = result.rows[0].id;
        const token = jwt.sign({ id: userId }, JWT_SECRET);
        res.status(201).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
});


// Rota para login de usuário
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        const user = result.rows[0];

        if (!user) return res.status(400).send('User not found');

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(400).send('Invalid password');

        const token = jwt.sign({ id: user.id }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});

module.exports = router;
