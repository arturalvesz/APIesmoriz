const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const pool = require('./dbConfig');
const PORT = 3000;


const atletaRoutes = require('./routes/atletaRoutes');
const escalaoRoutes = require('./routes/escalaoRoutes');
const fotoRoutes = require('./routes/fotoRoutes');
const jogoRoutes = require('./routes/jogoRoutes');
const setsRoutes = require('./routes/setsRoutes');
const socioRoutes = require('./routes/socioRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const patrocinadorRoutes = require('./routes/patrocinadorRoutes');
const utilizadorRoutes = require('./routes/utilizadorRoutes');
const bilheteiraRoutes = require('./routes/bilheteiraRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const auth = require('./routes/auth');


app.use((req, res, next) => {
    if (req.originalUrl === "/api/stripe/webhook") {
        next(); // Do nothing with the body because I need it in a raw state.
    } else {
        express.json()(req, res, next); // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
    }
});
app.use('/api/atletas', atletaRoutes);
app.use('/api/escaloes', escalaoRoutes);
app.use('/api/fotos', fotoRoutes);
app.use('/api/jogos', jogoRoutes);
app.use('/api/socios', socioRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/patrocinadores', patrocinadorRoutes);
app.use('/api/utilizadores', utilizadorRoutes);
app.use('/api/sets', setsRoutes);
app.use('/api/bilheteira', bilheteiraRoutes),
app.use('/api/stripe', stripeRoutes),
app.use('/api/auth', auth);


app.listen(PORT, () => {
    console.log(`Servidor está ouvindo na porta ${PORT}`);
});
