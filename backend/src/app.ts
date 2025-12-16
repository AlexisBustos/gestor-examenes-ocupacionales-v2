import './config/sentry';
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node";
import AppRoutes from './routes';

const app = express();

// 1. SENTRY (Monitoreo)
Sentry.setupExpressErrorHandler(app);

// 2. CONFIGURACIÓN CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[CORS] Nota: Origen ${origin} no está en la lista blanca (pero permitido por ahora)`);
      callback(null, true); 
    }
  },
  credentials: true
}));

// --- 🛡️ SEGURIDAD NUEVA: Prevenir caché en el navegador ---
// Soluciona el reporte: "El sistema permite ver el Dashboard incluso después de cerrar sesión"
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});

// 3. MIDDLEWARES BÁSICOS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log limpio
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// 4. ARCHIVOS PÚBLICOS
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 5. RUTAS DEL SISTEMA
app.use('/api', AppRoutes);

// Healthcheck (Raíz)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Gestor Exámenes Ocupacionales v2 (Producción)',
    timestamp: new Date().toISOString()
  });
});

// --- 🚨 MANEJO DE ERRORES GLOBAL (Para TestSprite) ---

// A. Manejador para Rutas No Encontradas (404)
// Soluciona los errores 405/404 que devolvían HTML
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`,
    error: 'Not Found'
  });
});

// B. Manejador de Errores del Servidor (500)
// Soluciona el "JSONDecodeError" cuando el backend falla
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 Error Crítico:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error Interno del Servidor';

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

export default app;