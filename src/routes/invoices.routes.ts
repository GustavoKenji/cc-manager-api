import { Router } from 'express';
import { getInvoice, listInvoiceMonths, updateInvoiceStatus } from '../controllers/installments.controller';

const router = Router({ mergeParams: true });

router.get('/', listInvoiceMonths);
router.get('/:month', getInvoice);
router.patch('/:month/status', updateInvoiceStatus);

export default router;
