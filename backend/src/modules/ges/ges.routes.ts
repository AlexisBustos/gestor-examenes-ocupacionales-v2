import { Router } from 'express';
import multer from 'multer';
import { list, getOne, create, uploadReport } from './ges.controller';

const router = Router();

// Configuración simple de Multer (Guardar en carpeta 'uploads')
const upload = multer({ dest: 'uploads/' });

// Rutas existentes
router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);

// 👇 NUEVA RUTA: Subir Informe PDF
// 'file' es el nombre del campo que envía el frontend
router.post('/:id/report', upload.single('file'), uploadReport);

export const gesRouter = router;