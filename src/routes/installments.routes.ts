import { Router } from 'express';
import { updateInstallmentStatus } from '../controllers/installments.controller';

const router = Router({ mergeParams: true });

router.patch('/:installmentId', updateInstallmentStatus);

export default router;
