import { Request, Response } from 'express';
// Importamos login Y register del servicio
import { login, register } from './auth.service';

// --- HANDLE LOGIN (Igual que antes) ---
export const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login Error:', error.message);
    // Manejo simple de errores
    const status = error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta' ? 401 : 500;
    res.status(status).json({ error: error.message });
  }
};

// --- HANDLE REGISTER (Nuevo) ---
export const handleRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validación básica antes de llamar al servicio
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Llamamos al servicio
    const newUser = await register({ name, email, password, role });
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser
    });

  } catch (error: any) {
    console.error('Register Error:', error.message);
    // Si el error es que ya existe, devolvemos 400, si no 500
    const status = error.message === 'El correo ya está registrado' ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};