import { Router } from 'express';
import multer from 'multer';
import { addPrescription, removePrescription, updateStatus, addQuantitative, removeQuantitative } from './reports.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Prescripciones
router.post('/prescriptions', addPrescription);
router.delete('/prescriptions/:id', removePrescription);
router.patch('/prescriptions/:id', updateStatus);

// Cuantitativos
router.post('/quantitative', upload.single('file'), addQuantitative);
router.delete('/quantitative/:id', removeQuantitative);

export default router;