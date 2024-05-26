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
const bilheteRoutes = require('./routes/bilheteRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const stripeSociosRoutes = require('./routes/stripeSociosRoutes');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');
const auth = require('./routes/auth');


app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhookRoutes);


app.use(express.json())

app.use('/api/atletas', atletaRoutes);
app.use('/api/escaloes', escalaoRoutes);
app.use('/api/fotos', fotoRoutes);
app.use('/api/jogos', jogoRoutes);
app.use('/api/socios', socioRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/patrocinadores', patrocinadorRoutes);
app.use('/api/utilizadores', utilizadorRoutes);
app.use('/api/sets', setsRoutes);
app.use('/api/bilheteira', bilheteiraRoutes);
app.use('/api/bilhetes', bilheteRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/stripeSocios', stripeSociosRoutes);
app.use('/api/auth', auth);
app.use(express.static(path.join(__dirname, 'public')));



app.listen(PORT, () => {
    console.log(`Servidor está ouvindo na porta ${PORT}`);
});
