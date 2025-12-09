import { Router } from 'express';
import * as authController from './auth.controller'; // Asegúrate que esto apunte a tu controlador

const router = Router();

// 🛑 DEBUG: Imprimir en consola cuando alguien intente entrar aquí
router.use((req, res, next) => {
    console.log('🕵️‍♂️ ROUTER AUTH ALCANZADO:', req.method, req.url);
    next();
});

// ✅ Definimos la ruta de login explícitamente
// La ruta final será: /api/auth/login
router.post('/login', authController.login);

export default router;