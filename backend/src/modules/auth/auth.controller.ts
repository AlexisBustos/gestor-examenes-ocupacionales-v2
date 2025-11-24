import { Request, Response } from 'express';
import { login } from './auth.service';

export const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login Error:', error.message);
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
};