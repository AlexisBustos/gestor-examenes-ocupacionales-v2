import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar riesgos con sus protocolos
export const findAllRisks = async () => {
  return await prisma.riskAgent.findMany({
    orderBy: { name: 'asc' },
    include: {
      protocols: true 
    }
  });
};

// Guardar NUEVO protocolo (Conectado a S3)
// CAMBIO: Ahora recibimos 'fileUrl' que viene de Amazon
export const addProtocolDb = async (riskId: string, fileUrl: string, originalName: string) => {
  return await prisma.riskProtocol.create({
    data: {
      name: originalName,
      url: fileUrl, // Guardamos la URL de AWS S3 (ej: https://tu-bucket.s3...)
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