import { Router } from 'express';
import * as GesController from './ges.controller';
import { uploadS3 } from '../../config/upload'; // 👈 CAMBIO 1: Usamos el puente S3

const router = Router();

// CRUD
router.get('/', GesController.list);
router.post('/', GesController.create);

// Inteligencia
router.get('/area/:id/batteries', GesController.getAreaSuggestions);
router.get('/:id/batteries', GesController.getSuggestions);
router.put('/:id/batteries', GesController.updateRules);

// Documentos
router.get('/:id/documents', GesController.getDocuments);

// 👈 CAMBIO 2: Usamos uploadS3 aquí
router.post('/:id/documents', uploadS3.single('file'), GesController.uploadDocument);

// 👈 CAMBIO 3: Rutas para borrar documentos
router.delete('/:id/documents/qualitative/:docId', GesController.deleteQualitative);
router.delete('/:id/documents/quantitative/:docId', GesController.deleteQuantitative);

// Historial
router.get('/:id/history', GesController.getHistory);

// Detalle
router.get('/:id', GesController.getOne);

export default router;