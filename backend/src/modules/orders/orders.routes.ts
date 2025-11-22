import { Router } from 'express';
import { create, getOrders, updateStatus, remove } from './orders.controller';

const router = Router();

router.get('/', getOrders);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

export default router;