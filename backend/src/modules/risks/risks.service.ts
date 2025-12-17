import axios from 'axios';
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

// 4. ENVIAR CORREO DE DIFUSIÓN
export const sendRiskDistribution = async (
  riskId: string, 
  email: string, 
  subject: string, 
  message: string
) => {
  await axios.post('/risks/send-email', {
    riskId,
    email,
    subject,
    message
  });
};

// 👇 5. CONFIRMAR ODI (Firma Digital Simple Agrupada)
export const confirmDelivery = async (token: string, ip?: string, userAgent?: string) => {
    
    // 1. Buscamos TODOS los envíos con ese token (ahora pueden ser varios)
    const deliveries = await prisma.odiDelivery.findMany({
        where: { token },
        include: { 
            worker: true,
            document: true 
        }
    });

    if (!deliveries || deliveries.length === 0) {
        throw new Error("El enlace de confirmación no es válido o ha expirado.");
    }

    // 2. Verificamos si ya estaban firmados (basta con mirar el primero)
    const alreadySigned = deliveries[0].status === 'CONFIRMED';

    // 3. Si NO estaban firmados, los firmamos TODOS ahora
    if (!alreadySigned) {
        await prisma.odiDelivery.updateMany({
            where: { token },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
                ipAddress: ip || 'IP no registrada',
                userAgent: userAgent || 'Navegador no registrado'
            }
        });
    }

    // 4. Retornamos la info para mostrar en el frontend
    // (Tomamos los datos del trabajador del primer registro, ya que es el mismo para todos)
    return {
        success: true,
        alreadySigned,
        signedAt: alreadySigned ? deliveries[0].confirmedAt : new Date(),
        worker: {
            name: deliveries[0].worker.name,
            rut: deliveries[0].worker.rut,
            email: deliveries[0].worker.email
        },
        // Devolvemos la lista de documentos firmados para que el usuario sepa qué firmó
        documents: deliveries.map(d => d.document.title)
    };
};