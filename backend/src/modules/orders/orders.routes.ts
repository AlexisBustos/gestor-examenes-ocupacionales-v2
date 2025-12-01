import { Router } from 'express';
import { getOrders, create, updateStatus, setResult, getSuggestions } from './orders.controller';

const router = Router();

// Es importante que esta ruta vaya ANTES de /:id
router.get('/suggestions', getSuggestions); // GET /api/orders/suggestions?workerId=...&gesId=...

router.get('/', getOrders);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.patch('/battery/:batteryId/result', setResult);

export default router;