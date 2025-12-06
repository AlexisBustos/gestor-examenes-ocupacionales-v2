import { Router } from 'express';
import { getOrders, create, updateStatus, setResult, getSuggestions, getOne } from './orders.controller';

const router = Router();

// Es importante que esta ruta vaya ANTES de /:id
router.get('/suggestions', getSuggestions); // GET /api/orders/suggestions?workerId=...&gesId=...

router.get('/', getOrders);
router.post('/', create);
router.get('/:id', getOne); // GET /api/orders/12345 (Trae el detalle completo)
router.patch('/:id/status', updateStatus);
router.patch('/battery/:batteryId/result', setResult);

export default router;
