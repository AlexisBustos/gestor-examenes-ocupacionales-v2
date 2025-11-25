import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes';
import authRouter from './modules/auth/auth.routes';
import { companiesRouter } from './modules/companies/companies.routes';
import { workCentersRouter } from './modules/work-centers/work-centers.routes';
import { areasRouter } from './modules/areas/areas.routes';
import { gesRouter } from './modules/ges/ges.routes';
import ordersRouter from './modules/orders/orders.routes';
import importRouter from './modules/import/import.routes';
// 👇 Importamos el nuevo módulo
import costCentersRouter from './modules/finance/cost-centers.routes';

const router = Router();

// Rutas Públicas
router.use('/health', healthRouter);

// Rutas de Autenticación
router.use('/auth', authRouter);

// Rutas de Negocio
router.use('/companies', companiesRouter);
router.use('/work-centers', workCentersRouter);
router.use('/areas', areasRouter);
router.use('/ges', gesRouter);
router.use('/orders', ordersRouter);
router.use('/import', importRouter);

// 👇 Conectamos la nueva ruta aquí
router.use('/cost-centers', costCentersRouter);

export default router;