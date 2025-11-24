import express from 'express';
import cors from 'cors';
import path from 'path'; // <--- Importante para las rutas de carpetas
import AppRoutes from './routes';

const app = express();

// ---------------------------------------------------------
// 1. CONFIGURACIÓN CORS (Permisiva para Desarrollo)
// ---------------------------------------------------------
app.use(cors({
  origin: '*', // Permitir a todo el mundo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ---------------------------------------------------------
// 2. ALARMA DE DIAGNÓSTICO (Ding Dong)
// ---------------------------------------------------------
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
// 4. CARPETA PÚBLICA DE ARCHIVOS (PDFs)
// ---------------------------------------------------------
// Esto permite que cuando entres a http://localhost:3000/uploads/archivo.pdf, lo veas.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------------------------------------------------------
// 5. RUTAS DE LA API
// ---------------------------------------------------------
app.use('/api', AppRoutes);

// Ruta Raíz
app.get('/', (req, res) => {
  res.json({ message: 'Antigravity API Running 🚀' });
});

export default app;