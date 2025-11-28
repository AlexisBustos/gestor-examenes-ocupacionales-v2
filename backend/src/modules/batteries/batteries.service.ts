import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const findAllBatteries = async () => {
  return await prisma.examBattery.findMany({ orderBy: { name: 'asc' } });
};

export const createBattery = async (name: string) => {
  return await prisma.examBattery.create({
    data: { name, evaluationType: 'OCUPACIONAL' }
  });
};

export const deleteBattery = async (id: string) => {
  return await prisma.examBattery.delete({ where: { id } });
};