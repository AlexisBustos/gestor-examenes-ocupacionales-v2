import { Router } from 'express';
import * as authController from './auth.controller'; 

const router = Router();

// 🛑 DEBUG: Log para ver si entran las peticiones
router.use((req, res, next) => {
    console.log('🕵️‍♂️ ROUTER AUTH ALCANZADO:', req.method, req.url);
    next();
});

// Rutas existentes
router.post('/login', authController.login);
router.post('/register', authController.register);

// 👇 AGREGAMOS ESTAS DOS LÍNEAS NUEVAS (¡Esto es lo que faltaba!)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;