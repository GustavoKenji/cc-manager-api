import { Router } from 'express';
import { getInvoicesReport } from '../controllers/reports.controller';

const router = Router();
router.get('/invoices', getInvoicesReport);

export default router;