import { Router } from 'express';
import { getOrders, create, updateStatus, setResult } from './orders.controller';

const router = Router();

router.get('/', getOrders);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.patch('/battery/:batteryId/result', setResult); // <--- NUEVA RUTA

export default router;