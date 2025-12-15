import { Router } from 'express';
import { downloadSurveillance, downloadHeadcount } from './exports.controller';

const router = Router();

// GET /api/exports/surveillance
router.get('/surveillance', downloadSurveillance);

// GET /api/exports/headcount
router.get('/headcount', downloadHeadcount);

export default router;