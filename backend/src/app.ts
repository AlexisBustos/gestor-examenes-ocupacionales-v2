import './config/sentry'; // 🚨 IMPORTANTE: Esto carga la config básica (crearemos este archivo mini abajo)
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node"; // 🚨 Importamos Sentry
import AppRoutes from './routes';

const app = express();

// 🚨 1. SENTRY REQUEST HANDLER (Debe ser el primer middleware)
// Esto captura la petición apenas entra
Sentry.setupExpressErrorHandler(app);

// ---------------------------------------------------------
// 2. CONFIGURACIÓN CORS
// ---------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como Postman o server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// ---------------------------------------------------------
// 3. MIDDLEWARES ESTÁNDAR
// ---------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging básico en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ---------------------------------------------------------
// 4. CARPETA PÚBLICA (UPLOADS)
// ---------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------------------------------------------------------
// 5. RUTAS DE LA API
// ---------------------------------------------------------
// Creamos una ruta de prueba para verificar que Sentry funciona
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("Mi primer error capturado por Sentry!");
});

app.use('/api', AppRoutes);

// Ruta Raíz (Healthcheck simple del servidor)
app.get('/', (req, res) => {
  res.json({
    message: 'Antigravity API Running 🚀',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 🚨 6. SENTRY ERROR HANDLER (Debe ir DESPUÉS de las rutas y ANTES de tu manejo de errores propio)
// Nota: setupExpressErrorHandler ya inyecta esto automáticamente en versiones nuevas,
// pero si tienes un middleware de error personalizado al final, asegúrate de que Sentry vaya antes.

export default app;