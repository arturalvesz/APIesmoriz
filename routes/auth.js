const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const pool = require("../dbConfig");
require('dotenv').config(); 
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const nodemailer = require('nodemailer');


// Expressão regular para validação de senha
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

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

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM utilizador WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

        const deepLinkUrl = `esmorizgc://esmorizgc.pt/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset',
            text: `Clique no link a seguir para redefinir a palavra passe:\n\n ${deepLinkUrl}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email de redefinição de senha enviado', forgotPassword: token });
    } catch (error) {
        console.error('Erro ao enviar email de redefinição de senha:', error);
        res.status(500).json({ error: 'Erro ao enviar email de redefinição de senha' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { newPassword, token } = req.body;
    console.log('Token recebido:', token);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verificar a complexidade da senha
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).send('Password must meet complexity requirements');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await pool.query('UPDATE utilizador SET password = $1 WHERE email = $2 RETURNING *', [hashedPassword, decoded.email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.status(200).json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ error: 'Token inválido ou expirado' });
    }
});

// Rota para registo de usuário
router.post('/registo', async (req, res) => {
    const { nome, email, password, confirmPassword } = req.body;
    // Verificar se a senha e a senha confirmada coincidem
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }
    // Verificar a complexidade da senha
    if (!passwordRegex.test(password)) {
        return res.status(400).send('Password must meet complexity requirements');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query('INSERT INTO utilizador (nome, email, password) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, hashedPassword]);
        const newUser = result.rows[0]; 
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET);
        res.status(201).json({ token, user: { id: newUser.id, nome: newUser.nome, email: newUser.email }});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
});

router.get('/get-user-id/:token', async (req, res) => {
    // Extrair o token JWT dos parâmetros da rota
    const token = req.params.token;
    try {
        // Verificar se o token JWT é válido e decodificá-lo para obter o ID do usuário
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;
        // Retornar o ID do usuário na resposta
        res.json({userId : userId});
    } catch (error) {
        console.error('Erro ao verificar o token:', error);
        res.status(400).json({ error: 'Token inválido ou expirado' });
    }   
});
// Dados do usuário autenticado
router.get('/user-info/:token', async (req, res) => {
    const token = req.params.token;
    if (!token) return res.status(401).send('Token not provided');
    
    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;
        const result = await pool.query('SELECT nome, email FROM utilizador WHERE id = $1', [userId]);
        const user = result.rows[0];
        if (!user) return res.status(404).send('User not found');
        res.json({ authUser: { nome: user.nome, email: user.email, userId: userId } });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});


// Rota para login de usuário
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizador WHERE email = $1', [email]);

        const user = result.rows[0];

        if (!user) return res.status(400).send('User not found');

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(400).send('Invalid password');

        const token = jwt.sign({ id: user.id }, JWT_SECRET);
        res.json({ token, user: { id: user.id, nome: user.nome ,email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});

// Rota protegida
router.get('/protegida', authenticateToken, (req, res) => {
    res.json(req.user);
});

module.exports = router;
