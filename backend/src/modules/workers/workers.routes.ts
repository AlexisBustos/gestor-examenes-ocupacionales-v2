import { Router } from 'express';
import multer from 'multer';
import { list, importWorkers, checkRut, getOne, update, remove } from './workers.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', list);
router.get('/:id', getOne); // Ver detalle
router.patch('/:id', update); // Editar
router.delete('/:id', remove); // Eliminar
router.get('/check/:rut', checkRut);
router.post('/import', upload.single('file'), importWorkers);

export default router;