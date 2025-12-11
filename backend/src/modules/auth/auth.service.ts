import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// 👇 Importamos el cartero que acabamos de crear en el paso 1
import { sendPasswordResetEmail } from '../../utils/emailSender';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// --- LOGICA EXISTENTE: LOGIN ---
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Usuario no encontrado');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error('Contraseña incorrecta');

  const token = jwt.sign(
    { userId: user.id, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '8h' }
  );

  return { 
    token, 
    user: { id: user.id, email: user.email, name: user.name, role: user.role } 
  };
};

// --- LOGICA EXISTENTE: REGISTER ---
export const register = async (data: any) => {
  const { name, email, password, role } = data;
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('El correo ya está registrado');

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: { 
      email, 
      password: hashedPassword, 
      name, 
      role: role || 'USER' 
    },
  });

  return { id: user.id, email: user.email };
};

// --- 👇 NUEVO: LOGICA DE RECUPERACIÓN DE CONTRASEÑA ---

// 1. Solicitar cambio (Generar token y enviar mail)
export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Si no existe, retornamos mensaje genérico por seguridad
  if (!user) return { message: 'Si el correo existe, se envió el enlace.' };

  // Generar token y fecha (15 minutos)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); 

  // Guardar en DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: passwordResetExpires
    }
  });

  // Enviar correo usando el archivo utils/emailSender.ts
  await sendPasswordResetEmail(user.email, resetToken);

  return { message: 'Correo enviado' };
};

// 2. Ejecutar cambio (Validar token y guardar nueva pass)
export const resetUserPassword = async (token: string, newPassword: string) => {
  // Buscar usuario con token válido y NO expirado
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() } // gt = mayor que "ahora"
    }
  });

  if (!user) throw new Error('Token inválido o expirado');

  // Encriptar nueva clave
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Guardar y limpiar token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  return { message: 'Contraseña actualizada' };
};