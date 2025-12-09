import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------
// CONFIGURACIÓN INICIAL
// ---------------------------------------------------------
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware básicos
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Logs para ver en Render
app.use((req, res, next) => {
    console.log(`[SERVER NUCLEAR] Petición recibida: ${req.method} ${req.url}`);
    next();
});

// ---------------------------------------------------------
// 🚑 RUTA DE RESCATE: CREAR USUARIO
// ---------------------------------------------------------
// URL: .../api/fix-me
app.get('/api/fix-me', async (req, res) => {
    try {
        console.log('Intentando crear usuario ADMIN_VITAM...');
        const email = 'admin@geovitam.com';
        
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: email,
                    password: '123456', 
                    name: 'ADMIN_VITAM',
                    role: 'ADMIN_VITAM' // Rol correcto
                }
            });
            return res.json({ status: 'EXITO', msg: '✅ Usuario creado', user });
        }
        return res.json({ status: 'EXISTE', msg: '✅ El usuario ya existía', user });
    } catch (error: any) {
        console.error('Error DB:', error);
        return res.status(500).json({ error: error.message });
    }
});

// ---------------------------------------------------------
// 🚑 RUTA DE LOGIN DE EMERGENCIA
// ---------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
    console.log('Login directo recibido...');
    const { email } = req.body;

    if (email === 'admin@geovitam.com') {
        return res.json({
            ok: true,
            user: { 
                email, 
                name: 'ADMIN_VITAM', 
                role: 'ADMIN_VITAM' 
            },
            token: 'TOKEN_NUCLEAR_DE_PRUEBA'
        });
    }
    return res.status(401).json({ error: 'Credenciales malas' });
});

// Healthcheck
app.get('/', (req, res) => {
    res.send('SERVER NUCLEAR FUNCIONANDO ☢️');
});

// ---------------------------------------------------------
// ARRANCAR EL SERVIDOR
// ---------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🔥 Server Nuclear corriendo en puerto ${PORT}`);
});