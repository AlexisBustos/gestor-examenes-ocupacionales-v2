import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'vitam-secret-key';

export const login = async (email: string, password: string) => {
  // 1. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true } // Traer datos de empresa si es cliente
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // 2. Verificar contraseña
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Contraseña incorrecta');
  }

  // 3. Generar Token
  const token = jwt.sign(
    { id: user.id, role: user.role, companyId: user.companyId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // 4. Devolver info (sin password)
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};