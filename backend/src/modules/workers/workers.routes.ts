import { Router } from 'express';
import multer from 'multer';
import { list, importWorkers, checkRut, getOne, update, remove, create, analyzeTransfer, executeTransfer } from './workers.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- 1. RUTAS ESPECÍFICAS (Deben ir PRIMERO) ---

// Validación de RUT (Antes de /:id para que "check" no se tome como un ID)
router.get('/check/:rut', checkRut);

// Importación Masiva
router.post('/import', upload.single('file'), importWorkers);

// Movilidad de Personal
router.post('/analyze-transfer', analyzeTransfer);
router.post('/transfer', executeTransfer);


// --- 2. RUTAS RAÍZ ---

router.get('/', list);    // Listar todos
router.post('/', create); // Crear uno nuevo


// --- 3. RUTAS GENÉRICAS CON PARÁMETRO ID (Siempre al FINAL) ---
// Si las pones antes, Express pensará que "check" o "import" son IDs.

router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;