import { Router } from 'express';
import { handleLogin, handleRegister } from './auth.controller';

const router = Router();

router.post('/login', handleLogin);
router.post('/register', handleRegister); // <--- Agregamos esta línea

export default router;