import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar riesgos con sus protocolos
export const findAllRisks = async () => {
  return await prisma.riskAgent.findMany({
    orderBy: { name: 'asc' },
    include: {
      protocols: true // <--- Traemos la lista de archivos
    }
  });
};

// Guardar NUEVO protocolo (Agrega a la lista)
export const addProtocolDb = async (riskId: string, filename: string, originalName: string) => {
  return await prisma.riskProtocol.create({
    data: {
      name: originalName,
      url: `/uploads/${filename}`,
      riskAgentId: riskId
    }
  });
};

// Borrar protocolo específico
export const removeProtocolDb = async (protocolId: string) => {
  return await prisma.riskProtocol.delete({
    where: { id: protocolId }
  });
};