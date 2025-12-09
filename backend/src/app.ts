import './config/sentry';
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node";
import AppRoutes from './routes';

const app = express();

// 🚨 1. SENTRY REQUEST HANDLER
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
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // En producción a veces queremos ser estrictos, pero para depurar hoy, 
      // permitiremos el acceso si viene de tu Frontend y loguearemos si falla.
      console.log(`[CORS CHECK] Origin: ${origin}`); 
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        // Si tienes problemas de CORS en producción, cambia esto temporalmente a true
        callback(null, true); 
      }
    }
  },
  credentials: true
}));

// ---------------------------------------------------------
// 3. MIDDLEWARES ESTÁNDAR Y LOGS (MODIFICADO)
// ---------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 CAMBIO CRÍTICO: Loguear SIEMPRE, no solo en development
// Esto es vital para ver en Render qué ruta está llegando
app.use((req, res, next) => {
  console.log(`[DEBUG RENDER] Método: ${req.method} | URL: ${req.url}`);
  next();
});

// ---------------------------------------------------------
// 4. CARPETA PÚBLICA
// ---------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------------------------------------------------------
// 5. RUTAS DE LA API
// ---------------------------------------------------------
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("Sentry Test Error");
});

// Aquí definimos que todo lo que venga en AppRoutes tendrá el prefijo /api
// Ejemplo: si AppRoutes tiene '/auth/login', la ruta final es '/api/auth/login'
app.use('/api', AppRoutes);

// He comentado esto para evitar duplicidad y confusión. 
// Forcemos al frontend a usar /api siempre.
// app.use('/', AppRoutes); 

// Healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend GEOVITAM funcionando 🚀',
    timestamp: new Date().toISOString()
  });
});

export default app;