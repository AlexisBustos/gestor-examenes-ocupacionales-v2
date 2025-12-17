import { Router } from 'express';
// Importamos el middleware de seguridad (EL GUARDIA)
import { authenticate } from './middlewares/auth.middleware';

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
import exportsRouter from './modules/exports/exports.routes';
import usersRouter from './modules/users/user.routes';

// 👇 1. IMPORTAMOS EL CONTROLADOR ESPECÍFICO
import { confirmOdiPublic } from './modules/risks/risks.controller'; 

const router = Router();

// LOG DE DEPURACIÓN GLOBAL
router.use((req, res, next) => {
    console.log(`📍 [ROUTES.TS] Petición: ${req.method} ${req.url}`);
    next();
});

// --- RUTAS PÚBLICAS (Cualquiera puede entrar) ---
router.use('/health', healthRouter);
router.use('/auth', (req, res, next) => {
    console.log('📍 [ROUTES.TS] Entrando a auth...');
    next();
}, authRouter);

// 👇 2. AGREGAMOS ESTA RUTA AQUÍ (PÚBLICA)
// Esto permite que el link del correo funcione sin estar logueado
router.get('/public/odi/confirm/:token', confirmOdiPublic);


// --- RUTAS PROTEGIDAS (Solo con Token válido) ---
// Aplicamos 'authenticate' antes de dejar pasar a estas rutas.

router.use('/companies', authenticate, companiesRouter);
router.use('/work-centers', authenticate, workCentersRouter);
router.use('/areas', authenticate, areasRouter);
router.use('/ges', authenticate, gesRouter);
router.use('/orders', authenticate, ordersRouter); 
router.use('/import', authenticate, importRouter);
router.use('/cost-centers', authenticate, costCentersRouter);
router.use('/reports', authenticate, reportsRouter);
router.use('/risks', authenticate, risksRouter); // Las demás de riesgos siguen protegidas
router.use('/workers', authenticate, workersRouter);
router.use('/analytics', authenticate, analyticsRouter); 
router.use('/config', authenticate, configRouter);
router.use('/batteries', authenticate, batteriesRouter);
router.use('/exports', authenticate, exportsRouter);
router.use('/users', authenticate, usersRouter);

export default router;