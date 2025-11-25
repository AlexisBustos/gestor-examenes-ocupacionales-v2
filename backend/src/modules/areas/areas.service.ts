import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAreas = async (workCenterId?: string) => {
  const where = workCenterId ? { workCenterId } : {};
  return await prisma.area.findMany({
    where,
    include: { costCenter: true } // Traemos el CC asignado
  });
};

export const createArea = async (data: any) => {
  return await prisma.area.create({ data });
};

// 👇 ESTA ES LA FUNCIÓN NUEVA QUE NECESITAMOS
export const updateArea = async (id: string, data: any) => {
  return await prisma.area.update({
    where: { id },
    data
  });
};