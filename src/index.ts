import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { requireAuth } from './middleware/auth';
import cardsRoutes from './routes/cards.routes';
import installmentsRoutes from './routes/installments.routes';
import invoicesRoutes from './routes/invoices.routes';
import purchasesRoutes from './routes/purchases.routes';
import reportsRoutes from './routes/reports.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Health check público, sem autenticação — útil para o Cloud Run
// saber que o serviço está de pé.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// A partir daqui, todas as rotas exigem um token válido do Firebase Auth.
// As rotas aninhadas (purchases, invoices, installments) são montadas
// antes de /cards para deixar explícito que dependem de um :cardId.
app.use('/cards/:cardId/purchases', requireAuth, purchasesRoutes);
app.use('/cards/:cardId/invoices', requireAuth, invoicesRoutes);
app.use('/cards/:cardId/installments', requireAuth, installmentsRoutes);
app.use('/cards', requireAuth, cardsRoutes);
app.use('/reports', requireAuth, reportsRoutes);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
