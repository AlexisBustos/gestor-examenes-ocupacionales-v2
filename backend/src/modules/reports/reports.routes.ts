import { Router } from 'express';
import * as ReportsController from './reports.controller';

const router = Router();

// Rutas existentes (si tenías para subir cuantitativos, déjalas aquí)
// router.post('/quantitative', ...);

// --- RUTAS NUEVAS PARA PRESCRIPCIONES ---

// 1. Crear vinculada a un Informe Cualitativo
// POST /api/reports/technical/:technicalReportId/prescriptions
router.post('/technical/:technicalReportId/prescriptions', ReportsController.addTechnicalPrescription);

// 2. Crear vinculada a un Informe Cuantitativo
// POST /api/reports/quantitative/:quantitativeReportId/prescriptions
router.post('/quantitative/:quantitativeReportId/prescriptions', ReportsController.addQuantitativePrescription);

// 3. Gestión directa de prescripciones (Editar / Borrar)
// PATCH /api/reports/prescriptions/:id
router.patch('/prescriptions/:id', ReportsController.updatePrescriptionItem);

// DELETE /api/reports/prescriptions/:id
router.delete('/prescriptions/:id', ReportsController.removePrescription);

export default router;