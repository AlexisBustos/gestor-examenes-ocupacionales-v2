import { Router } from 'express';
// 👇 Agregamos getCostCenters a la importación
import { getSurveillance, getCostCenters } from './analytics.controller';

const router = Router();

// Ruta de Vigilancia (Existente)
router.get('/surveillance', getSurveillance);

// 👇 NUEVA RUTA: Análisis de Costos
router.get('/costs', getCostCenters);

export default router;