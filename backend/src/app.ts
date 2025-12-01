import express from 'express';
import cors from 'cors';
import path from 'path';
import AppRoutes from './routes';

const app = express();

// ---------------------------------------------------------
// 1. CONFIGURACIÓN CORS
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
      // En desarrollo permitimos localhost:5173 explícitamente arriba.
      // Si estamos en desarrollo y el origen no está en la lista (ej: localhost:3000), 
      // podríamos permitirlo o no. Por seguridad, nos ceñimos a allowedOrigins.
      // Pero para facilitar dev local si frontend corre en otro puerto:
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
// 2. MIDDLEWARES ESTÁNDAR
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
// 3. CARPETA PÚBLICA (UPLOADS)
// ---------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------------------------------------------------------
// 4. RUTAS DE LA API
// ---------------------------------------------------------
app.use('/api', AppRoutes);

// Ruta Raíz (Healthcheck simple del servidor)
app.get('/', (req, res) => {
  res.json({
    message: 'Antigravity API Running 🚀',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

export default app;