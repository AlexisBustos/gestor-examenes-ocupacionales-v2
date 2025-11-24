import { Router } from 'express';
import { handleLogin } from './auth.controller';

const router = Router();

router.post('/login', handleLogin);

export default router;