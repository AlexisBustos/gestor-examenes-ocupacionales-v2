import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto'; 
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3';
import { sendODIEmail } from '../../utils/emailSender'; 

const prisma = new PrismaClient();

// 1. CREAR O ACTUALIZAR RIESGO
export const createRiskAgent = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const file = req.file;

    if (!name) return res.status(400).json({ error: 'El nombre del riesgo es obligatorio' });

    let documentData = null;
    if (file) {
      console.log('📂 Procesando archivo para S3:', file.originalname);
      const cleanRiskName = name.replace(/\s+/g, '_');
      const s3FileName = `${cleanRiskName}_${Date.now()}_${file.originalname}`;
      documentData = await uploadFileToS3(file.buffer, s3FileName, file.mimetype);
    }

    const result = await prisma.$transaction(async (tx) => {
      const agent = await tx.riskAgent.upsert({
        where: { name: name },
        update: { ...(description && { description }) },
        create: { name, description: description || '' },
      });

      if (documentData) {
        await tx.odiDocument.create({
          data: {
            title: file!.originalname,
            s3Key: documentData.key,
            publicUrl: documentData.url,
            agentId: agent.id,
            version: 1, 
            isActive: true
          }
        });
      }
      return agent;
    });

    res.status(200).json({ message: 'Riesgo procesado exitosamente', agent: result, docUrl: documentData?.url });
  } catch (error: any) {
    console.error('Error en createRiskAgent:', error);
    res.status(500).json({ error: 'Error interno al procesar riesgo' });
  }
};

// 2. LISTAR RIESGOS
export const getRisks = async (req: Request, res: Response) => {
  try {
    const risks = await prisma.riskAgent.findMany({
      include: {
        documents: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } 
      },
      orderBy: { name: 'asc' }
    });
    res.json(risks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar riesgos' });
  }
};

// 3. ELIMINAR RIESGO
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
      selectedDocs = [risk.documents[0]];
    }
    if (selectedDocs.length === 0) return res.status(400).json({ error: 'Debes seleccionar al menos un documento.' });

    const attachments = selectedDocs.map(doc => ({
      filename: doc.title,
      path: doc.publicUrl
    }));

    // C. Definimos Destinatarios
    let recipients: { id?: string; email: string; name: string }[] = [];

    if (targetMode === 'COMPANY') {
      if (!targetId) return res.status(400).json({ error: 'Falta seleccionar la empresa.' });
      
      const workers = await prisma.worker.findMany({
        where: { companyId: targetId, active: true, email: { not: null } },
        select: { id: true, email: true, name: true }
      });
      
      recipients = workers.map(w => ({ id: w.id, email: w.email!, name: w.name }));

    } else {
      if (!email) return res.status(400).json({ error: 'Falta el email.' });
      const workerFound = await prisma.worker.findFirst({ where: { email: email } });
      recipients.push({ 
        id: workerFound?.id, 
        email, 
        name: workerFound?.name || 'Usuario Externo' 
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
                            sentAt: new Date()
                        }
                    });
                }
            }

            const sent = await sendODIEmail(
                recipient.email, 
                recipient.name, 
                "Gestión Vitam", 
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

// 6. CONFIRMAR RECEPCIÓN (EL CLIENTE HACE CLIC EN EL LINK) - VERSIÓN GET PÚBLICA
// 👇 Esta es la función nueva que usa tu Frontend
export const confirmOdiPublic = async (req: Request, res: Response) => {
    const { token } = req.params; // Viene por URL: /api/odi/confirm/:token

    try {
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';

        // 1. Buscamos el token
        const deliveries = await prisma.odiDelivery.findMany({
            where: { token: token },
            include: { 
                worker: true // 👈 TRAEMOS AL TRABAJADOR
            }
        });

        if (deliveries.length === 0) {
            return res.status(404).json({ error: "Token inválido o expirado" });
        }

        const delivery = deliveries[0]; // Tomamos el primero del grupo
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
                worker: workerData // Enviamos datos
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

        // 4. Devolvemos éxito
        return res.json({ 
            success: true, 
            alreadySigned: false, 
            signedAt: new Date(),
            worker: workerData // Enviamos datos
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