import { Router } from 'express';
import { getDashboardAlerts } from './alerts.controller';

const router = Router();

// GET /api/alerts/dashboard
router.get('/dashboard', getDashboardAlerts);

export default router;