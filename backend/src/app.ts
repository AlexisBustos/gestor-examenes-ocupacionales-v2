import './config/sentry'; 
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

// 1. CONFIGURACIÓN BÁSICA
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 2. LOGS DE SEGURIDAD
app.use((req, res, next) => {
    console.log(`[RESCATE] Recibiendo: ${req.method} ${req.url}`);
    next();
});

// ---------------------------------------------------------
// 🚑 RUTA 1: CREAR USUARIO MAESTRO (Fix-Me)
// ---------------------------------------------------------
// URL: https://tu-api.onrender.com/api/fix-me
app.get('/api/fix-me', async (req, res) => {
    try {
        console.log('Verificando usuario Admin...');
        const email = 'admin@geovitam.com';
        
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('Usuario no existe. Creando con rol ADMIN_VITAM...');
            
            // 👇 AQUÍ USAMOS EL ROL CORRECTO QUE ME DISTE
            user = await prisma.user.create({
                data: {
                    email: email,
                    password: '123456', // Contraseña temporal
                    name: 'ADMIN_VITAM',
                    role: 'ADMIN_VITAM' // 👈 CORREGIDO: Usamos el Enum exacto
                }
            });
            return res.json({ msg: '✅ USUARIO CREADO EXITOSAMENTE', user });
        }

        return res.json({ msg: '✅ EL USUARIO YA EXISTE', user });
    } catch (error: any) {
        console.error('Error DB:', error);
        return res.status(500).json({ error: error.message, details: 'Revisa si el schema en la BD coincide con el código' });
    }
});

// ---------------------------------------------------------
// 🚑 RUTA 2: LOGIN DE EMERGENCIA
// ---------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
    console.log('Intento de Login recibido en ruta de emergencia');
    const { email } = req.body;

    // Validación manual simple
    if (email === 'admin@geovitam.com') {
        return res.json({
            ok: true,
            message: 'Login de Emergencia Exitoso',
            user: { 
                email, 
                name: 'ADMIN_VITAM', 
                role: 'ADMIN_VITAM' // 👈 Enviamos el rol correcto al Frontend
            },
            token: 'TOKEN_FALSO_DE_PRUEBA_123'
        });
    }

    return res.status(401).json({ ok: false, message: 'Credenciales incorrectas (Test)' });
});

// Healthcheck
app.get('/', (req, res) => res.send('API GEOVITAM: MODO RESCATE ACTIVO 🚑'));

export default app;