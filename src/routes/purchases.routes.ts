import { Router } from 'express';
import { createPurchase, deletePurchase } from '../controllers/purchases.controller';

const router = Router({ mergeParams: true });

router.post('/', createPurchase);
router.delete('/:purchaseId', deletePurchase);

export default router;
