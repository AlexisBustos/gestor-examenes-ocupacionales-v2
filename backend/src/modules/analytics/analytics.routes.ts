import { Router } from 'express';
// 👇 Agregamos getDashboard al import
import { getSurveillance, getCostCenters, getDashboard } from './analytics.controller';

const router = Router();

// Ruta de Vigilancia (Existente)
router.get('/surveillance', getSurveillance);

// Ruta Análisis de Costos (Existente)
router.get('/costs', getCostCenters);

// 👇 NUEVA RUTA: Dashboard General (KPIs)
// Endpoint final: /api/analytics/dashboard
router.get('/dashboard', getDashboard);

export default router;