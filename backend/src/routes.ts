import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes';
import authRouter from './modules/auth/auth.routes';
import { companiesRouter } from './modules/companies/companies.routes';
import { workCentersRouter } from './modules/work-centers/work-centers.routes';
import { areasRouter } from './modules/areas/areas.routes';
import { gesRouter } from './modules/ges/ges.routes';
import ordersRouter from './modules/orders/orders.routes';
import importRouter from './modules/import/import.routes';
import costCentersRouter from './modules/finance/cost-centers.routes';
import reportsRouter from './modules/reports/reports.routes';
import risksRouter from './modules/risks/risks.routes';
import workersRouter from './modules/workers/workers.routes'; // <--- NUEVO

const router = Router();

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
router.use('/workers', workersRouter); // <--- CONECTADO

export default router;