import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Instancia de Prisma (si tienes un archivo lib/prisma.ts centralizado, podrías importarlo de ahí, 
// pero esto funcionará perfectamente tal como lo tenías).
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'vitam-secret-key';

// ------------------------------------------------------------------
// LOGIN (Lógica original)
// ------------------------------------------------------------------
export const login = async (email: string, password: string) => {
  // 1. Buscar usuario e incluir datos de empresa
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true }
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

// ------------------------------------------------------------------
// REGISTER (Lógica corregida para TypeScript)
// ------------------------------------------------------------------
export const register = async (userData: any) => {
  const { name, email, password, role } = userData;

  // 1. Verificar si ya existe el correo
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('El correo ya está registrado');
  }

  // 2. Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Validar Rol
  // CORRECCIÓN: Usamos UserRole.USER_EMPRESA (el Enum) en lugar de un string suelto
  let assignedRole: UserRole = UserRole.USER_EMPRESA;

  // Verificamos si el rol que nos envían existe en la lista de roles permitidos
  if (role && Object.values(UserRole).includes(role as UserRole)) {
      assignedRole = role as UserRole;
  }

  // 4. Crear usuario en la BD
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    },
  });

  // 5. Retornar usuario sin la contraseña
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};