import express from 'express';
import cors from 'cors';
import { AppRoutes } from './routes';

const app = express();

// Middlewares
app.use(cors()); // Permite todo por ahora
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', AppRoutes);

export default app;
