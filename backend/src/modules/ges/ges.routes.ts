import { Router } from 'express';
import * as GesController from './ges.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// CRUD
router.get('/', GesController.list);
router.post('/', GesController.create);

// Inteligencia
router.get('/area/:id/batteries', GesController.getAreaSuggestions);
router.get('/:id/batteries', GesController.getSuggestions);
router.put('/:id/batteries', GesController.updateRules);

// Documentos
router.get('/:id/documents', GesController.getDocuments);
router.post('/:id/documents', upload.single('file'), GesController.uploadDocument);

// 👇 NUEVO: HISTORIAL COMPLETO (Antes de /:id)
router.get('/:id/history', GesController.getHistory);

// Detalle
router.get('/:id', GesController.getOne);

export default router;