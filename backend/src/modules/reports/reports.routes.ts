import { Router } from 'express';
import { upload } from '../../middlewares/upload.middleware';
import * as ReportsController from './reports.controller';

const router = Router();

// Upload a new report for a company
router.post('/companies/:companyId/reports', upload.single('file'), ReportsController.uploadReport);

// Get all reports for a company
router.get('/companies/:companyId/reports', ReportsController.getCompanyReports);

// Link a report to a GES (or Area)
router.post('/ges/:gesId/link-report', ReportsController.linkReport);

export default router;
