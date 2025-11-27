import { Router } from 'express';
import { getSurveillance } from './analytics.controller';

const router = Router();

router.get('/surveillance', getSurveillance);

export default router;