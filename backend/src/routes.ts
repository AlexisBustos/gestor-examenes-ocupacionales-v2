import { Router } from 'express';
// Importamos los routers de cada módulo
import healthRouter from './modules/health/health.routes';
import authRouter from './modules/auth/auth.routes';
import companiesRouter from './modules/companies/companies.routes';
import workCentersRouter from './modules/work-centers/work-centers.routes';
import areasRouter from './modules/areas/areas.routes';
import gesRouter from './modules/ges/ges.routes';
import ordersRouter from './modules/orders/orders.routes';
import importRouter from './modules/import/import.routes';
import costCentersRouter from './modules/finance/cost-centers.routes';
import reportsRouter from './modules/reports/reports.routes';
import risksRouter from './modules/risks/risks.routes';
import workersRouter from './modules/workers/workers.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import configRouter from './modules/config/config.routes';
import batteriesRouter from './modules/batteries/batteries.routes';

const router = Router();

// MÓDULOS CRÍTICOS AHORA (Moved to top)
router.use('/config', configRouter);       // -> /api/config
router.use('/batteries', batteriesRouter); // -> /api/batteries

// Definición de rutas base (sin /api, eso ya lo pone server.ts)
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/companies', companiesRouter);
router.use('/work-centers', workCentersRouter);
router.use('/areas', areasRouter);
router.use('/ges', gesRouter);
router.use('/orders', ordersRouter);
router.use('/import', importRouter);
router.use('/cost-centers', costCentersRouter);
router.use('/reports', reportsRouter);
router.use('/risks', risksRouter);
router.use('/workers', workersRouter);
router.use('/analytics', analyticsRouter);

export default router;