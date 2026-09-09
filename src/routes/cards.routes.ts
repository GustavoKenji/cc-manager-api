import { Router } from 'express';
import { createCard, deleteCard, getCard, listCards, updateCard } from '../controllers/cards.controller';

const router = Router();

router.get('/', listCards);
router.post('/', createCard);
router.get('/:cardId', getCard);
router.put('/:cardId', updateCard);
router.delete('/:cardId', deleteCard);

export default router;
