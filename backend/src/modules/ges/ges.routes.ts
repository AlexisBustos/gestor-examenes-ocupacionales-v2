import { Router } from 'express';
import * as GesController from './ges.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', GesController.list);
router.post('/', GesController.create);

// Rutas más específicas primero
router.get('/area/:id/batteries', GesController.getAreaSuggestions);

// Inteligencia y Reglas por GES
router.get('/:id/batteries', GesController.getSuggestions);
router.put('/:id/batteries', GesController.updateRules);

// Detalle de un GES
router.get('/:id', GesController.getOne);

// Si tenías rutas de reportes, las puedes re-agregar acá, por ejemplo:
// router.post('/:id/report', upload.single('file'), GesController.uploadReport);

export default router;
