import { Request, Response } from 'express';
// 👇 TRUCO IMPORTANTE: Renombramos la importación para evitar conflicto de nombres
// AGREGAMOS AQUÍ: requestPasswordReset y resetUserPassword que vienen del servicio
import { 
    login as loginService, 
    register as registerService,
    requestPasswordReset,
    resetUserPassword
} from './auth.service';

// --- LOGIN (TU CÓDIGO ORIGINAL) ---
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

// --- REGISTER (TU CÓDIGO ORIGINAL) ---
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

// --- 👇 LO NUEVO: AGREGAMOS ESTAS DOS FUNCIONES AL FINAL ---

// 1. SOLICITUD DE CAMBIO (Forgot Password)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    // Llamamos a la lógica nueva del servicio
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
};

// 2. CAMBIO DE CLAVE (Reset Password)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    // Llamamos a la lógica nueva del servicio
    const result = await resetUserPassword(token, newPassword);
    res.json(result);
  } catch (error: any) {
    console.error('Reset Password Error:', error.message);
    const status = error.message === 'Token inválido o expirado' ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};