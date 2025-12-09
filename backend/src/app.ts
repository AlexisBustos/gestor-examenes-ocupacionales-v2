import './config/sentry';
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node";
import AppRoutes from './routes';

// 🚑 1. IMPORTAMOS LA RUTA DE AUTH DIRECTAMENTE (SALTANDO INTERMEDIARIOS)
import AuthRoutesDirect from './modules/auth/auth.routes';

const app = express();

// 🚨 SENTRY
Sentry.setupExpressErrorHandler(app);

// ---------------------------------------------------------
// CONFIGURACIÓN CORS
// ---------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitimos acceso temporalmente para asegurar que no sea bloqueo
    callback(null, true);
  },
  credentials: true
}));

// ---------------------------------------------------------
// MIDDLEWARES Y LOGS
// ---------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log para ver en Render
app.use((req, res, next) => {
  console.log(`[DEBUG RENDER] Método: ${req.method} | URL: ${req.url}`);
  next();
});

// CARPETA PÚBLICA
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------------------------------------------------------
// 🚑 RUTAS DE LA API (AQUÍ ESTÁ LA SOLUCIÓN)
// ---------------------------------------------------------

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("Sentry Test Error");
});

// 1. CONEXIÓN DIRECTA PARA EL LOGIN (El arreglo)
// Al poner esto ANTES de AppRoutes, Express atenderá el login aquí mismo.
// Ruta final: /api/auth/login
app.use('/api/auth', AuthRoutesDirect);

// 2. RESTO DEL SISTEMA (Empresas, trabajadores, etc.)
// Esto sigue funcionando igual para no romper nada más.
app.use('/api', AppRoutes);


// Healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend GEOVITAM con Bypass de Auth 🚀',
    timestamp: new Date().toISOString()
  });
});

export default app;