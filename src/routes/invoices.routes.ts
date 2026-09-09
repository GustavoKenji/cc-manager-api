import { Router } from 'express';
import { getInvoice, listInvoiceMonths } from '../controllers/installments.controller';

const router = Router({ mergeParams: true });

router.get('/', listInvoiceMonths);
router.get('/:month', getInvoice);

export default router;
