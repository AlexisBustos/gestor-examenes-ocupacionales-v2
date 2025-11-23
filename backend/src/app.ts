import express from 'express';
import cors from 'cors';
import AppRoutes from './routes'; // <--- AQUÍ ESTABA EL ERROR (Quitamos las llaves)

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas Base (/api)
app.use('/api', AppRoutes);

// Ruta de prueba raíz
app.get('/', (req, res) => {
  res.json({ message: 'Antigravity API Running 🚀' });
});

export default app;