import { Router } from 'express';
import * as ReportsController from './reports.controller';

const router = Router();

// 1. Crear Prescripción para Informe TÉCNICO (Cualitativo)
router.post('/technical/:technicalReportId/prescriptions', ReportsController.addTechnicalPrescription);

// 2. Crear Prescripción para Informe CUANTITATIVO
router.post('/quantitative/:quantitativeReportId/prescriptions', ReportsController.addQuantitativePrescription);

// 👇 3. NUEVO: Crear Prescripción para TMERT
router.post('/tmert/:tmertReportId/prescriptions', ReportsController.addTmertPrescription);

// 4. Actualizar Prescripción (Cualquier tipo)
router.put('/prescriptions/:id', ReportsController.updatePrescriptionItem);

// 5. Eliminar Prescripción
router.delete('/prescriptions/:id', ReportsController.removePrescription);

export default router;