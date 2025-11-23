import { Request, Response } from 'express';
import * as authService from './auth.service';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const result = await authService.login(email, password);
        res.json(result);
    } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'Credenciales inválidas') {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
