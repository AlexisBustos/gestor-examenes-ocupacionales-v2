import './config/sentry';
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node";
import AppRoutes from './routes';

// 🧹 LIMPIEZA: Ya quitamos Prisma y Bcrypt porque app.ts solo debe configurar, no procesar lógica.

const app = express();

// 1. SENTRY (Monitoreo)
Sentry.setupExpressErrorHandler(app);

// 2. CONFIGURACIÓN CORS
// Mantenemos la lista para seguridad futura, pero la configuración sigue siendo amigable.
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitimos peticiones sin origen (como Postman) o si coinciden con la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[CORS] Nota: Origen ${origin} no está en la lista blanca (pero permitido por ahora)`);
      // Mantenemos esto permissive para asegurar que Vercel entre sin problemas
      callback(null, true); 
    }
  },
  credentials: true
}));

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
// Aquí conectamos toda la lógica real (Login, Empresas, etc.)
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