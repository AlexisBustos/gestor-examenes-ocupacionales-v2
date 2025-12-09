import { Request, Response } from 'express';
// 👇 TRUCO IMPORTANTE: Renombramos la importación para evitar conflicto de nombres
import { login as loginService, register as registerService } from './auth.service';

// --- LOGIN ---
// Ahora la función se llama 'login' exactamente como lo pide tu archivo de rutas
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Llamamos al servicio (con el nombre alias)
    const result = await loginService(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login Error:', error.message);
    const status = error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta' ? 401 : 500;
    res.status(status).json({ error: error.message });
  }
};

// --- REGISTER ---
// Lo renombramos a 'register' para mantener consistencia
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

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