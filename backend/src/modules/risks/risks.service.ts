import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAllRisks = async () => {
  return await prisma.riskAgent.findMany({
    orderBy: { name: 'asc' }
  });
};

export const uploadProtocolDb = async (id: string, filename: string) => {
  return await prisma.riskAgent.update({
    where: { id },
    data: { protocolUrl: `/uploads/${filename}` }
  });
};