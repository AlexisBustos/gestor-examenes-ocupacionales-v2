import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Listar todas
export const findAllBatteries = async () => {
  return await prisma.examBattery.findMany({ orderBy: { name: 'asc' } });
};

// Crear nueva
export const createBattery = async (name: string) => {
  return await prisma.examBattery.create({
    data: { 
      name, 
      evaluationType: 'OCUPACIONAL' // Valor por defecto
    }
  });
};

// Borrar
export const deleteBattery = async (id: string) => {
  return await prisma.examBattery.delete({ where: { id } });
};