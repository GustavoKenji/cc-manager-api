import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { requireAuth } from './middleware/auth';
import cardsRoutes from './routes/cards.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Health check público, sem autenticação — útil para o Cloud Run
// saber que o serviço está de pé.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// A partir daqui, todas as rotas exigem um token válido do Firebase Auth.
app.use('/cards', requireAuth, cardsRoutes);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
