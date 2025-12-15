import { Router } from 'express';
import multer from 'multer';
import { 
    createRiskAgent, 
    getRisks, 
    deleteRiskAgent, 
    sendRiskEmail, 
    countRecipients, 
    confirmOdiPublic, // 👈 Usamos la nueva función
    getGlobalHistory, 
    getWorkerHistory 
} from './risks.controller'; // 👈 CORREGIDO: Volvemos a PLURAL (con 's') que es como está tu archivo

const router = Router();

// CONFIGURACIÓN DE MULTER (Memoria RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// RUTA 1: Listar Riesgos (GET /api/risks)
router.get('/', getRisks);

// RUTA 2: Crear/Actualizar Riesgo y Subir PDF (POST /api/risks)
router.post('/', upload.single('pdf'), createRiskAgent);

// RUTA 3: Eliminar Riesgo (DELETE /api/risks/:id)
router.delete('/:id', deleteRiskAgent);

// 👇 RUTA DE ENVÍO MANUAL
router.post('/send-email', sendRiskEmail);

// Ruta para contar
router.post('/count-targets', countRecipients);

// 👇 RUTA PÚBLICA PARA CONFIRMAR (GET con Token)
// Esta es la clave para que el link del correo funcione
router.get('/confirm/:token', confirmOdiPublic);

// 👇 RUTAS DE HISTORIAL
router.get('/history', getGlobalHistory);           
router.get('/history/:workerId', getWorkerHistory); 

export default router;