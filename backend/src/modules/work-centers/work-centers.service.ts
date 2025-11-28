import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAllWorkCenters = async (companyId?: string) => {
  const where = companyId ? { companyId } : {};
  return await prisma.workCenter.findMany({
    where,
    include: { company: true, areas: true }
  });
};

export const createWorkCenter = async (data: any) => {
  return await prisma.workCenter.create({ data });
};

export const deleteWorkCenter = async (id: string) => {
  return await prisma.workCenter.delete({ where: { id } });
};