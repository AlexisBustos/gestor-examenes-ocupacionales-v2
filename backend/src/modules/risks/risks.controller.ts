import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto'; 
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3';
import { sendODIEmail } from '../../utils/emailSender'; 

const prisma = new PrismaClient();

// ============================================================
// 1. CREAR O ACTUALIZAR RIESGO (SOLO DATOS)
// ============================================================
export const createRiskAgent = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ error: 'El nombre del riesgo es obligatorio' });

    // Solo creamos/actualizamos el agente, NO subimos archivo aquí para evitar duplicidad lógica.
    // La subida se maneja en uploadProtocol.
    const agent = await prisma.riskAgent.upsert({
        where: { name: name },
        update: { ...(description && { description }) },
        create: { name, description: description || '' },
    });

    res.status(200).json({ message: 'Riesgo procesado exitosamente', agent });
  } catch (error: any) {
    console.error('Error en createRiskAgent:', error);
    res.status(500).json({ error: 'Error interno al procesar riesgo' });
  }
};

// ============================================================
// 1.5 SUBIR PROTOCOLO (MULTI-ARCHIVOS)
// ============================================================
export const uploadProtocol = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // ID del Riesgo
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No se envió ningún archivo' });

        // Verificamos que el riesgo exista
        const risk = await prisma.riskAgent.findUnique({ where: { id } });
        if (!risk) return res.status(404).json({ error: 'El riesgo no existe' });

        console.log(`📂 Subiendo archivo extra para riesgo: ${risk.name}`);

        const cleanRiskName = risk.name.replace(/\s+/g, '_');
        const s3FileName = `${cleanRiskName}_${Date.now()}_${file.originalname}`;
        
        // Subimos a S3
        const documentData = await uploadFileToS3(file.buffer, s3FileName, file.mimetype);

        // Guardamos en BD sin borrar los anteriores (Acumulativo)
        const newDoc = await prisma.odiDocument.create({
            data: {
                title: file.originalname,
                s3Key: documentData.key,
                publicUrl: documentData.url,
                agentId: risk.id,
                version: 1, 
                isActive: true // Queda activo junto con los demás
            }
        });

        res.status(200).json({ message: 'Documento agregado correctamente', document: newDoc });

    } catch (error) {
        console.error("Error subiendo protocolo extra:", error);
        res.status(500).json({ error: "Error al subir documento" });
    }
};

// ============================================================
// 1.6 ELIMINAR PROTOCOLO ESPECÍFICO
// ============================================================
export const deleteProtocol = async (req: Request, res: Response) => {
    try {
        const { protocolId } = req.params;

        const doc = await prisma.odiDocument.findUnique({ where: { id: protocolId } });
        if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

        // Borrar de S3
        await deleteFileFromS3(doc.s3Key);

        // Borrar de BD
        await prisma.odiDocument.delete({ where: { id: protocolId } });

        res.json({ message: 'Protocolo eliminado correctamente' });
    } catch (error) {
        console.error("Error eliminando protocolo:", error);
        res.status(500).json({ error: "Error al eliminar protocolo" });
    }
};

// ============================================================
// 2. LISTAR RIESGOS (CON TODOS SUS DOCS)
// ============================================================
export const getRisks = async (req: Request, res: Response) => {
  try {
    const risks = await prisma.riskAgent.findMany({
      include: {
        // Traemos TODOS los documentos activos, ordenados por fecha
        documents: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } 
      },
      orderBy: { name: 'asc' }
    });
    
    // Mapeamos para que el frontend reciba "protocols" limpio
    const formatted = risks.map(r => ({
        ...r,
        protocols: r.documents.map(d => ({
            id: d.id,
            name: d.title,
            url: d.publicUrl,
            createdAt: d.createdAt
        }))
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar riesgos' });
  }
};

// ============================================================
// 3. ELIMINAR RIESGO COMPLETO
// ============================================================
export const deleteRiskAgent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const documents = await prisma.odiDocument.findMany({ where: { agentId: id } });
        for (const doc of documents) { await deleteFileFromS3(doc.s3Key); }
        await prisma.riskAgent.delete({ where: { id } });
        res.json({ message: 'Riesgo y documentos eliminados' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar riesgo' });
    }
};

// ... (El resto de funciones: countRecipients, confirmOdiPublic, etc. se mantienen igual, si quieres te las incluyo completas) ...
// Para ahorrar espacio, asumo que mantienes las funciones de abajo (countRecipients, confirmOdiPublic, history, etc) 
// Si las necesitas, dímelo y te pego el archivo 100% completo, pero lo importante arriba son las funciones 1, 1.5, 1.6 y 2.

// 4. CONTAR DESTINATARIOS
export const countRecipients = async (req: Request, res: Response) => {
  try {
    const { targetMode, targetId } = req.body;
    let count = 0;

    if (targetMode === 'COMPANY') {
      if (!targetId) return res.json({ count: 0 });
      count = await prisma.worker.count({
        where: { companyId: targetId, active: true, email: { not: null } }
      });
    } else if (targetMode === 'INDIVIDUAL') {
      count = 1;
    }
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error contando destinatarios' });
  }
};

// 5. ENVIAR CORREO AUDITABLE
export const sendRiskEmail = async (req: Request, res: Response) => {
  try {
    const { riskId, targetMode, targetId, email, subject, message, documentIds } = req.body;
    
    // A. Buscamos el Riesgo
    const risk = await prisma.riskAgent.findUnique({
      where: { id: riskId },
      include: { documents: { where: { isActive: true } } }
    });

    if (!risk || risk.documents.length === 0) return res.status(404).json({ error: 'Riesgo sin documentos activos.' });

    // B. Filtramos Documentos
    let selectedDocs = [];
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      selectedDocs = risk.documents.filter(doc => documentIds.includes(doc.id));
    } else {
      // Si no especifica, enviamos TODOS los activos (Mejora Multi-doc por defecto)
      selectedDocs = risk.documents;
    }
    
    if (selectedDocs.length === 0) return res.status(400).json({ error: 'No hay documentos válidos para enviar.' });

    const attachments = selectedDocs.map(doc => ({
      filename: doc.title,
      path: doc.publicUrl
    }));

    // C. Definimos Destinatarios
    let recipients: { id?: string; email: string; name: string; companyName?: string }[] = [];

    if (targetMode === 'COMPANY') {
      if (!targetId) return res.status(400).json({ error: 'Falta seleccionar la empresa.' });
      
      const workers = await prisma.worker.findMany({
        where: { companyId: targetId, active: true, email: { not: null } },
        include: { company: true }
      });
      
      recipients = workers.map(w => ({ 
          id: w.id, 
          email: w.email!, 
          name: w.name,
          companyName: w.company?.name
      }));

    } else {
      if (!email) return res.status(400).json({ error: 'Falta el email.' });
      const workerFound = await prisma.worker.findFirst({ 
          where: { email: email },
          include: { company: true }
      });
      recipients.push({ 
        id: workerFound?.id, 
        email, 
        name: workerFound?.name || 'Usuario Externo',
        companyName: workerFound?.company?.name || 'Empresa Externa'
      });
    }

    console.log(`🚀 Iniciando envío auditado a ${recipients.length} personas.`);

    // D. BUCLE DE ENVÍO
    let successCount = 0;
    
    for (const recipient of recipients) {
        try {
            const deliveryToken = randomUUID();

            if (recipient.id) {
                for (const doc of selectedDocs) {
                    await prisma.odiDelivery.create({
                        data: {
                            workerId: recipient.id,
                            documentId: doc.id,
                            token: deliveryToken,
                            status: 'PENDING',
                            sentAt: new Date(),
                            confirmedAt: null
                        }
                    });
                }
            }

            const sent = await sendODIEmail(
                recipient.email, 
                recipient.name, 
                recipient.companyName || "Empresa", 
                [risk.name], 
                attachments, 
                deliveryToken 
            );

            if (sent) successCount++;

        } catch (err) {
            console.error(`❌ Error con ${recipient.email}:`, err);
        }
    }

    res.json({ message: `✅ Proceso finalizado. Enviados: ${successCount} de ${recipients.length}.` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error crítico en el envío.' });
  }
};

// 6. CONFIRMAR RECEPCIÓN PUBLICO
export const confirmOdiPublic = async (req: Request, res: Response) => {
    const { token } = req.params; 

    try {
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';

        // 1. Buscamos el token
        const deliveries = await prisma.odiDelivery.findMany({
            where: { token: token },
            include: { worker: true }
        });

        if (deliveries.length === 0) return res.status(404).json({ error: "Token inválido o expirado" });

        const delivery = deliveries[0]; 
        const workerData = {
            name: delivery.worker?.name || 'Usuario Externo',
            rut: delivery.worker?.rut || 'N/A'
        };

        // 2. Verificamos si YA estaba confirmado
        if (delivery.status === 'CONFIRMED') {
            return res.json({ 
                success: true, 
                alreadySigned: true, 
                signedAt: delivery.confirmedAt,
                worker: workerData 
            });
        }

        // 3. Confirmamos TODAS las entregas con ese token
        await prisma.odiDelivery.updateMany({
            where: { token: token },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
                ipAddress: ip,
                userAgent: userAgent
            }
        });

        return res.json({ 
            success: true, 
            alreadySigned: false, 
            signedAt: new Date(),
            worker: workerData 
        });

    } catch (error) {
        console.error("Error confirmando ODI:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 7. HISTORIAL GLOBAL
export const getGlobalHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.odiDelivery.findMany({
      include: {
        worker: { select: { name: true, rut: true, email: true } },
        document: { 
            select: { title: true, agent: { select: { name: true } } } 
        }
      },
      orderBy: { sentAt: 'desc' },
      take: 100 
    });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
};

// 8. HISTORIAL POR TRABAJADOR
export const getWorkerHistory = async (req: Request, res: Response) => {
  try {
    const { workerId } = req.params;
    const history = await prisma.odiDelivery.findMany({
      where: { workerId },
      include: {
        document: { 
            select: { title: true, agent: { select: { name: true } } } 
        }
      },
      orderBy: { sentAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo historial del trabajador' });
  }
};