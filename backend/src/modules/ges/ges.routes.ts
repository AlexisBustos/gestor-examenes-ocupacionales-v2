import { Router } from 'express';
import * as GesController from './ges.controller';
import { uploadS3 } from '../../config/upload'; 

const router = Router();

// CRUD
router.get('/', GesController.list);
router.post('/', GesController.create);

// Inteligencia (Baterías Médicas)
router.get('/area/:id/batteries', GesController.getAreaSuggestions);
router.get('/:id/batteries', GesController.getSuggestions);
router.put('/:id/batteries', GesController.updateRules);

// 👇 NUEVAS RUTAS PARA VINCULAR RIESGOS (ODI) - AGREGA ESTAS
router.get('/:id/risks', GesController.getGesRisks);
router.put('/:id/risks', GesController.updateGesRisks);

// Documentos
router.get('/:id/documents', GesController.getDocuments);

// Subida de documentos (incluye TMERT)
router.post('/:id/documents', uploadS3.single('file'), GesController.uploadDocument);

// Rutas para borrar documentos
router.delete('/:id/documents/qualitative/:docId', GesController.deleteQualitative);
router.delete('/:id/documents/quantitative/:docId', GesController.deleteQuantitative);
router.delete('/:id/documents/tmert/:docId', GesController.deleteTmert);

// Historial
router.get('/:id/history', GesController.getHistory);

// Detalle
router.get('/:id', GesController.getOne);

export default router;