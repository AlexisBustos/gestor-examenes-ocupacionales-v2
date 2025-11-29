import { Router } from 'express';
import multer from 'multer';
import { importRules, getRules, createRule, deleteRule } from './config.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rutas de Reglas (/api/config/...)
router.get('/rules', getRules);         // GET /api/config/rules
router.post('/rules', createRule);      // POST /api/config/rules
router.delete('/rules/:id', deleteRule); // DELETE /api/config/rules/:id

// Importación Masiva
router.post('/import-rules', upload.single('file'), importRules);

export default router;