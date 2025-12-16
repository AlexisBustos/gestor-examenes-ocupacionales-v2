import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto'; 
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3';
import { sendODIEmail } from '../../utils/emailSender'; 

const prisma = new PrismaClient();

// 1. CREAR RIESGO
export const createRiskAgent = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });

    const agent = await prisma.riskAgent.upsert({
        where: { name: name },
        update: { ...(description && { description }) },
        create: { name, description: description || '' },
    });
    res.status(200).json({ message: 'Procesado', agent });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// 2. LISTAR RIESGOS
export const getRisks = async (req: Request, res: Response) => {
  try {
    const risks = await prisma.riskAgent.findMany({
      include: { documents: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
      orderBy: { name: 'asc' }
    });
    const formatted = risks.map(r => ({
        ...r,
        protocols: r.documents.map(d => ({
            id: d.id, name: d.title, url: d.publicUrl, createdAt: d.createdAt
        }))
    }));
    res.json(formatted);
  } catch (error) { res.status(500).json({ error: 'Error listando' }); }
};

// 3. SUBIR PROTOCOLO
export const uploadProtocol = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Sin archivo' });

        const risk = await prisma.riskAgent.findUnique({ where: { id } });
        if (!risk) return res.status(404).json({ error: 'Riesgo no existe' });

        const cleanName = risk.name.replace(/\s+/g, '_');
        const s3Name = `${cleanName}_${Date.now()}_${file.originalname}`;
        const docData = await uploadFileToS3(file.buffer, s3Name, file.mimetype);

        const newDoc = await prisma.odiDocument.create({
            data: {
                title: file.originalname, s3Key: docData.key, publicUrl: docData.url, agentId: risk.id, isActive: true
            }
        });
        res.status(200).json({ message: 'Subido', document: newDoc });
    } catch (error) { res.status(500).json({ error: "Error subiendo" }); }
};

// 4. ELIMINAR PROTOCOLO
export const deleteProtocol = async (req: Request, res: Response) => {
    try {
        const { protocolId } = req.params;
        const doc = await prisma.odiDocument.findUnique({ where: { id: protocolId } });
        if (!doc) return res.status(404).json({ error: 'No encontrado' });

        await deleteFileFromS3(doc.s3Key);
        await prisma.odiDocument.delete({ where: { id: protocolId } });
        res.json({ message: 'Eliminado' });
    } catch (error) { res.status(500).json({ error: "Error eliminando" }); }
};

// 5. ELIMINAR RIESGO
export const deleteRiskAgent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const docs = await prisma.odiDocument.findMany({ where: { agentId: id } });
        for (const d of docs) { await deleteFileFromS3(d.s3Key).catch(console.error); }
        await prisma.riskAgent.delete({ where: { id } });
        res.json({ message: 'Riesgo eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error eliminando' }); }
};

// ============================================================
// 🌟 6. OBTENER FILTROS (CORREGIDO: Áreas Reales y Agentes)
// ============================================================
export const getRiskFilters = async (req: Request, res: Response) => {
    try {
        // 1. Centros de Costo
        const costCenters = await prisma.costCenter.findMany({
            include: { company: { select: { name: true } } },
            orderBy: { code: 'asc' }
        });

        // 2. Grupos GES
        const gesGroups = await prisma.ges.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });

        // 3. Agentes de Riesgo
        const riskAgents = await prisma.riskAgent.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });

        // 4. Áreas (Desde la tabla Area real)
        const areas = await prisma.area.findMany({
            select: { id: true, name: true, workCenter: { select: { name: true } } },
            orderBy: { name: 'asc' }
        });
        
        // Formateamos para el frontend
        const formattedAreas = areas.map(a => ({
            id: a.id,
            name: `${a.name} (${a.workCenter.name})` // Ej: "Mantenimiento (Planta 1)"
        }));

        res.json({ costCenters, gesGroups, areas: formattedAreas, riskAgents });

    } catch (error) {
        console.error("Error filtros:", error);
        res.status(500).json({ error: "Error cargando filtros" });
    }
};

// ============================================================
// 🔍 HELPER: CONSTRUCTOR DE CONDICIONES WHERE
// ============================================================
const buildWhereCondition = (targetMode: string, targetId: string) => {
    const where: any = { active: true, email: { not: null } };

    if (targetMode === 'COMPANY') where.companyId = targetId;
    
    if (targetMode === 'COST_CENTER') where.costCenterId = targetId;
    
    // ÁREA: Buscamos trabajadores cuyo GES actual pertenezca a esa área
    if (targetMode === 'AREA') {
        where.currentGes = { areaId: targetId };
    }
    
    // GES: Buscamos trabajadores asignados a este GES
    if (targetMode === 'GES') {
        where.currentGesId = targetId;
    }
    
    // 🌟 AGENTE: La magia está aquí. Buscamos por GES o Directo
    if (targetMode === 'RISK_AGENT') {
        where.OR = [
            // 1. Está en un GES que tiene ese riesgo
            { currentGes: { riskExposures: { some: { riskAgentId: targetId } } } },
            // 2. O tiene el riesgo asignado manualmente
            { exposures: { some: { agentId: targetId, isActive: true } } }
        ];
    }

    return where;
};

// ============================================================
// 7. CONTAR DESTINATARIOS
// ============================================================
export const countRecipients = async (req: Request, res: Response) => {
  try {
    const { targetMode, targetId } = req.body;
    
    if (targetMode === 'INDIVIDUAL') return res.json({ count: 1 });
    if (!targetId) return res.json({ count: 0 });

    const where = buildWhereCondition(targetMode, targetId);
    const count = await prisma.worker.count({ where });
    
    res.json({ count });
  } catch (error) { 
      console.error(error);
      res.status(500).json({ error: 'Error contando' }); 
  }
};

// ============================================================
// 8. ENVIAR CORREO
// ============================================================
export const sendRiskEmail = async (req: Request, res: Response) => {
  try {
    const { riskId, targetMode, targetId, email, documentIds } = req.body;
    
    // Validar Riesgo y Docs
    const risk = await prisma.riskAgent.findUnique({
      where: { id: riskId },
      include: { documents: { where: { isActive: true } } }
    });
    if (!risk || !risk.documents.length) return res.status(404).json({ error: 'Riesgo sin documentos.' });

    let selectedDocs = documentIds?.length ? risk.documents.filter(d => documentIds.includes(d.id)) : risk.documents;
    if (!selectedDocs.length) return res.status(400).json({ error: 'Sin documentos válidos.' });

    const attachments = selectedDocs.map(d => ({ filename: d.title, path: d.publicUrl }));

    // Obtener Destinatarios
    let recipients = [];

    if (targetMode === 'INDIVIDUAL') {
        if (!email) return res.status(400).json({ error: 'Falta email' });
        const worker = await prisma.worker.findFirst({ where: { email }, include: { company: true } });
        recipients.push({ id: worker?.id, email, name: worker?.name || 'Usuario', companyName: worker?.company?.name });
    } else {
        if (!targetId) return res.status(400).json({ error: 'Falta Target ID' });
        
        const where = buildWhereCondition(targetMode, targetId);
        const workers = await prisma.worker.findMany({ where, include: { company: true } });
        recipients = workers.map(w => ({ id: w.id, email: w.email!, name: w.name, companyName: w.company?.name }));
    }

    if (!recipients.length) return res.status(400).json({ error: 'No se encontraron destinatarios con los filtros seleccionados.' });

    console.log(`🚀 Enviando a ${recipients.length} personas. Modo: ${targetMode}`);

    // Loop de Envío
    let successCount = 0;
    for (const r of recipients) {
        try {
            const token = randomUUID();
            if (r.id) {
                for (const doc of selectedDocs) {
                    await prisma.odiDelivery.create({
                        data: { workerId: r.id, documentId: doc.id, token, status: 'PENDING' }
                    });
                }
            }
            const sent = await sendODIEmail(r.email, r.name, r.companyName || "", [risk.name], attachments, token);
            if (sent) successCount++;
        } catch (e) { console.error(`Error con ${r.email}`, e); }
    }

    res.json({ message: `Enviados: ${successCount} de ${recipients.length}` });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error envío' }); }
};

// ... (Resto de funciones confirmOdiPublic, Historiales se mantienen igual)
// 9. CONFIRMACIÓN PÚBLICA
export const confirmOdiPublic = async (req: Request, res: Response) => {
    const { token } = req.params;
    try {
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const deliveries = await prisma.odiDelivery.findMany({ where: { token }, include: { worker: true } });
        if (!deliveries.length) return res.status(404).json({ error: "Token inválido" });

        const first = deliveries[0];
        if (first.status === 'CONFIRMED') {
            return res.json({ success: true, alreadySigned: true, signedAt: first.confirmedAt, worker: { name: first.worker?.name, rut: first.worker?.rut } });
        }

        await prisma.odiDelivery.updateMany({
            where: { token },
            data: { status: 'CONFIRMED', confirmedAt: new Date(), ipAddress: ip as string, userAgent }
        });

        return res.json({ success: true, alreadySigned: false, signedAt: new Date(), worker: { name: first.worker?.name, rut: first.worker?.rut } });
    } catch (e) { console.error(e); res.status(500).json({ error: "Error interno" }); }
};

// 10. HISTORIALES
export const getGlobalHistory = async (req: Request, res: Response) => {
    try {
        const h = await prisma.odiDelivery.findMany({
            include: { worker: { select: { name: true, rut: true, email: true } }, document: { select: { title: true, agent: { select: { name: true } } } } },
            orderBy: { sentAt: 'desc' }, take: 100
        });
        res.json(h);
    } catch (e) { res.status(500).json({ error: 'Error historial' }); }
};

export const getWorkerHistory = async (req: Request, res: Response) => {
    try {
        const { workerId } = req.params;
        const h = await prisma.odiDelivery.findMany({
            where: { workerId },
            include: { document: { select: { title: true, agent: { select: { name: true } } } } },
            orderBy: { sentAt: 'desc' }
        });
        res.json(h);
    } catch (e) { res.status(500).json({ error: 'Error historial trabajador' }); }
};