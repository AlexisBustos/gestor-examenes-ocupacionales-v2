import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes';
import { companiesRouter } from './modules/companies/companies.routes';
import { workCentersRouter } from './modules/work-centers/work-centers.routes';
import { areasRouter } from './modules/areas/areas.routes';
import { gesRouter } from './modules/ges/ges.routes';
import { ordersRouter } from './modules/orders/orders.routes';

export const AppRoutes = Router();

AppRoutes.use('/health', healthRouter);
AppRoutes.use('/companies', companiesRouter);
AppRoutes.use('/work-centers', workCentersRouter);
AppRoutes.use('/areas', areasRouter);
AppRoutes.use('/ges', gesRouter);
AppRoutes.use('/orders', ordersRouter);
