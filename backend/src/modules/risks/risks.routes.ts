import { Router } from 'express';
import multer from 'multer';
import { createRiskAgent, getRisks, deleteRiskAgent, sendRiskEmail, countRecipients, confirmDelivery, getGlobalHistory, getWorkerHistory } from './risks.controller';

const router = Router();

// CONFIGURACIÓN DE MULTER (Memoria RAM)
// Esto es vital: Guardamos el archivo en memoria temporalmente
// para que el controlador pueda procesarlo y mandarlo a S3.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// RUTA 1: Listar Riesgos (GET /api/risks)
router.get('/', getRisks);

// RUTA 2: Crear/Actualizar Riesgo y Subir PDF (POST /api/risks)
// El frontend debe enviar el archivo en un campo FormData llamado 'pdf'
router.post('/', upload.single('pdf'), createRiskAgent);

// RUTA 3: Eliminar Riesgo (DELETE /api/risks/:id)
router.delete('/:id', deleteRiskAgent);

// 👇 NUEVA RUTA DE ENVÍO
router.post('/send-email', sendRiskEmail);

// Ruta para contar
router.post('/count-targets', countRecipients);

// 👇 RUTA PÚBLICA PARA CONFIRMAR (No requiere Auth Middleware idealmente, o manejada con cuidado)
router.post('/confirm', confirmDelivery);

// 👇 NUEVAS RUTAS DE HISTORIAL
router.get('/history', getGlobalHistory);           // Tabla General
router.get('/history/:workerId', getWorkerHistory); // Para el Timeline

export default router;