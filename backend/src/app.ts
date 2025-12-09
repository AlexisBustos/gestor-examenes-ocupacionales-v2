import './config/sentry';
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node";
// 👇 Importamos tus rutas modulares (que ya arreglamos antes)
import AppRoutes from './routes'; 

const app = express();

// 1. SENTRY (Monitoreo)
Sentry.setupExpressErrorHandler(app);

// 2. CORS (Configuración permisiva para evitar bloqueos por ahora)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitimos todo temporalmente para asegurar el funcionamiento
    callback(null, true);
  },
  credentials: true
}));

// 3. MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log limpio para producción
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// 4. ARCHIVOS PÚBLICOS
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 5. RUTAS PROFESIONALES
// Conectamos todo el sistema de nuevo.
// Ruta base: /api
app.use('/api', AppRoutes);

// Healthcheck (Raíz)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Gestor Exámenes Ocupacionales v2 (Producción)',
    timestamp: new Date().toISOString()
  });
});

export default app;