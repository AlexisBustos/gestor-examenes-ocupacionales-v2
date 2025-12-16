import { Router } from 'express';
import multer from 'multer';
import { 
    createRiskAgent, 
    getRisks, 
    deleteRiskAgent, 
    sendRiskEmail, 
    countRecipients, 
    confirmOdiPublic,
    getGlobalHistory, 
    getWorkerHistory,
    uploadProtocol, // 👈 Nueva función importada
    deleteProtocol  // 👈 Nueva función importada
} from './risks.controller';

const router = Router();

// CONFIGURACIÓN DE MULTER (Memoria RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ============================================================
// RUTAS CRUD PRINCIPALES
// ============================================================

// 1. Listar Riesgos (GET /api/risks)
router.get('/', getRisks);

// 2. Crear/Actualizar Riesgo (POST /api/risks)
// NOTA: Ya no requiere archivo obligatorio aquí, se puede subir después.
router.post('/', upload.single('pdf'), createRiskAgent);

// 3. Eliminar Riesgo Completo (DELETE /api/risks/:id)
router.delete('/:id', deleteRiskAgent);

// ============================================================
// RUTAS MULTI-DOCUMENTO (NUEVAS 🌟)
// ============================================================

// 4. Subir Protocolo Extra a un Riesgo Existente
// POST /api/risks/:id/protocols
router.post('/:id/protocols', upload.single('file'), uploadProtocol);

// 5. Eliminar un Protocolo Específico
// DELETE /api/risks/protocols/:protocolId
router.delete('/protocols/:protocolId', deleteProtocol);

// ============================================================
// RUTAS OPERATIVAS (ENVÍO Y CONFIRMACIÓN)
// ============================================================

// Enviar Campaña Manual
router.post('/send-email', sendRiskEmail);

// Contar Destinatarios (Pre-cálculo)
router.post('/count-targets', countRecipients);

// Confirmación Pública (El link del correo)
router.get('/confirm/:token', confirmOdiPublic);

// ============================================================
// RUTAS DE HISTORIAL
// ============================================================

router.get('/history', getGlobalHistory);           
router.get('/history/:workerId', getWorkerHistory); 

export default router;