import express from 'express';
import cors from 'cors';
import AppRoutes from './routes'; // Importación por defecto (sin llaves)

const app = express();

// ---------------------------------------------------------
// 1. CONFIGURACIÓN CORS (Permisiva para Desarrollo)
// ---------------------------------------------------------
app.use(cors({
  origin: '*', // ¡Permitir a todo el mundo! (Crucial para que no falle localmente)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---------------------------------------------------------
// 2. ALARMA DE DIAGNÓSTICO (El "Ding Dong")
// ---------------------------------------------------------
// Este código nos avisará en la terminal cada vez que el Frontend toque la puerta
app.use((req, res, next) => {
  console.log(`🔔 ¡DING DONG! Recibí una petición: ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------
// 3. MIDDLEWARES ESTÁNDAR
// ---------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------
// 4. RUTAS
// ---------------------------------------------------------
// Todas las rutas de la API empiezan con /api
app.use('/api', AppRoutes);

// Ruta Raíz para verificar que el servidor vive
app.get('/', (req, res) => {
  res.json({ message: 'Antigravity API Running 🚀' });
});

export default app;