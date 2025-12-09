import { Request, Response } from 'express';
// 👇 CAMBIO 1: Usamos 'as' para cambiar el nombre y evitar conflictos de nombres
import { login as loginService, register as registerService } from './auth.service';

// --- HANDLE LOGIN ---
// 👇 CAMBIO 2: Exportamos como 'login' para que auth.routes.ts lo encuentre
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Llamamos al servicio con el nuevo nombre
    const result = await loginService(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login Error:', error.message);
    const status = error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta' ? 401 : 500;
    res.status(status).json({ error: error.message });
  }
};

// --- HANDLE REGISTER ---
// 👇 Exportamos como 'register' por consistencia
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Llamamos al servicio con el nuevo nombre
    const newUser = await registerService({ name, email, password, role });
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser
    });

  } catch (error: any) {
    console.error('Register Error:', error.message);
    const status = error.message === 'El correo ya está registrado' ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};