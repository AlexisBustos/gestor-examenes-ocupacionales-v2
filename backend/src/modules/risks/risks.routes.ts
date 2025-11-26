import { Router } from 'express';
import multer from 'multer';
import { list, uploadProtocol } from './risks.controller';

const router = Router();
// Configuración para guardar archivos en la carpeta 'uploads'
const upload = multer({ dest: 'uploads/' });

router.get('/', list);
router.post('/:id/protocol', upload.single('file'), uploadProtocol);

export default router;