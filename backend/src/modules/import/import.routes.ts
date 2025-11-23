import { Router } from 'express';
import multer from 'multer';
import { uploadStructure } from './import.controller'; // <--- Nombre Correcto

const router = Router();

// Configuración de Multer para recibir el archivo en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Ruta POST /api/import/structure
// 'file' es el nombre del campo que envía el frontend
router.post('/structure', upload.single('file'), uploadStructure);

export default router;