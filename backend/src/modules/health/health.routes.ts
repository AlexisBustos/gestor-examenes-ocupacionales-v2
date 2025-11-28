import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => res.send('OK'));

export const healthRouter = router; // Mantener por compatibilidad
export default router; // Agregar para el nuevo sistema