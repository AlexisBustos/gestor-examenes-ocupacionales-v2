import './config/sentry';
import express from 'express';
import cors from 'cors';
import path from 'path';
import * as Sentry from "@sentry/node";
import AppRoutes from './routes';

// 👇 IMPORTS NECESARIOS PARA EL ARREGLO
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const app = express();

Sentry.setupExpressErrorHandler(app);

// CONFIGURACIÓN CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); 
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOGS
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------
// 🚑 RUTA DE EMERGENCIA: ARREGLAR PASSWORD (ESTA FALTABA)
// ---------------------------------------------------------
app.get('/api/encrypt-me', async (req, res) => {
    try {
        console.log('Encriptando contraseña...');
        // 1. Creamos el hash seguro de "123456"
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        // 2. Actualizamos al usuario
        const user = await prisma.user.update({
            where: { email: 'admin@geovitam.com' },
            data: { 
                password: hashedPassword,
                role: 'ADMIN_VITAM'
            }
        });
        
        res.json({ 
            status: 'ARREGLADO', 
            msg: '✅ Contraseña actualizada a formato seguro (Bcrypt).', 
            user: { email: user.email, role: user.role }
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message, hint: '¿Seguro que el usuario existe?' });
    }
});
// ---------------------------------------------------------


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// RUTAS PRINCIPALES
app.use('/api', AppRoutes);

// Healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Gestor Exámenes Ocupacionales v2 (Modo Fix)',
    timestamp: new Date().toISOString()
  });
});

export default app;