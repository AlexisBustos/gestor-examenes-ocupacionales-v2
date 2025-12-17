import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { sendODIEmail } from '../../utils/emailSender';

// Importamos tus servicios existentes
import { 
    findAllWorkers, 
    importWorkersDb, 
    findWorkerByRut, 
    getWorkerById, 
    updateWorker, 
    deleteWorker, 
    analyzeJobChange, 
    transferWorker, 
    createWorkerDb 
} from './workers.service';

const prisma = new PrismaClient();

export const list = async (req: Request, res: Response) => {
  try { res.json(await findAllWorkers()); } catch (e) { res.status(500).json({ error: 'Error listar' }); }
};

export const getOne = async (req: Request, res: Response) => {
    try {
      const worker = await getWorkerById(req.params.id);
      if (!worker) return res.status(404).json({ error: 'No encontrado' });
      res.json(worker);
    } catch (e) { res.status(500).json({ error: 'Error obtener' }); }
};

// 👇 ROBOT DE INGRESO (Versión Definitiva: Envío Agrupado)
export const update = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { employmentStatus } = req.body;

        // 1. FOTO ANTERIOR
        const previousWorker = await prisma.worker.findUnique({ 
            where: { id },
            select: { employmentStatus: true } 
        });

        // 2. ACTUALIZACIÓN (Mantiene lógica de desvinculación existente)
        const updatedWorker = await updateWorker(id, req.body);

        // 3. NUEVO ROBOT: Solo actúa si detecta ingreso a NÓMINA
        if (previousWorker?.employmentStatus !== 'NOMINA' && employmentStatus === 'NOMINA') {
            
            console.log(`🤖 [ROBOT ODI] Iniciando proceso de agrupación para: ${updatedWorker.name}`);

            // Buscamos toda la data (GES -> Riesgos -> Documentos)
            const workerFull = await prisma.worker.findUnique({
                where: { id },
                include: {
                    company: true,
                    currentGes: {
                        include: {
                            riskExposures: {
                                include: {
                                    riskAgent: {
                                        include: {
                                            documents: { where: { isActive: true } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (workerFull && workerFull.email && workerFull.currentGes) {
                
                // --- A. RECOLECCIÓN (AGRUPAR TODO) ---
                const riskNames: string[] = [];
                const attachments: { filename: string; path: string }[] = [];
                const documentIds: string[] = [];

                // Recorremos los agentes
                workerFull.currentGes.riskExposures.forEach(exp => {
                    // Nombre del riesgo (sin repetir)
                    if (!riskNames.includes(exp.riskAgent.name)) {
                        riskNames.push(exp.riskAgent.name);
                    }

                    // Documentos (Agrupamos TODOS en una sola lista)
                    exp.riskAgent.documents.forEach(doc => {
                        if (!documentIds.includes(doc.id)) {
                            documentIds.push(doc.id);
                            attachments.push({ 
                                filename: doc.title, 
                                path: doc.publicUrl 
                            });
                        }
                    });
                });

                // --- B. PROCESAMIENTO ---
                if (attachments.length > 0) {
                    const token = randomUUID();

                    console.log(`📎 [ROBOT ODI] Se encontraron ${attachments.length} documentos de ${riskNames.length} agentes.`);

                    // 1. Registrar cada documento en la BD (Iteramos solo para guardar)
                    for (const docId of documentIds) {
                        await prisma.odiDelivery.create({
                            data: {
                                workerId: workerFull.id,
                                documentId: docId,
                                token: token, // Comparten el mismo token
                                status: 'PENDING'
                            }
                        });
                    }
                    // 🛑 AQUÍ TERMINA EL BUCLE DE GUARDADO

                    // 2. Enviar Correo ÚNICO (Con todos los adjuntos acumulados)
                    await sendODIEmail(
                        workerFull.email,
                        workerFull.name,
                        workerFull.company.name,
                        riskNames,     
                        attachments,   // <--- Aquí van todos los PDFs juntos
                        token
                    );
                    
                    console.log(`✅ [ROBOT ODI] Correo UNIFICADO enviado a ${workerFull.email}`);

                } else {
                    console.log(`⚠️ [ROBOT ODI] El GES no tiene documentos activos. No se envió nada.`);
                }
            } else {
                console.log(`⚠️ [ROBOT ODI] Faltan datos (Email o GES) para enviar.`);
            }
        }

        res.json(updatedWorker);

    } catch (e) { 
        console.error("Error updating worker:", e);
        res.status(500).json({ error: 'Error actualizar' }); 
    }
};

export const remove = async (req: Request, res: Response) => {
    try { await deleteWorker(req.params.id); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({ error: 'Error eliminar' }); }
};

export const checkRut = async (req: Request, res: Response) => {
  try {
    const worker = await findWorkerByRut(req.params.rut);
    res.json(worker ? { exists: true, worker } : { exists: false });
  } catch (e) { res.status(500).json({ error: 'Error verificar' }); }
};

export const importWorkers = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
    res.json(await importWorkersDb(req.file.buffer));
  } catch (e: any) { res.status(500).json({ error: 'Error importando' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const worker = await createWorkerDb(req.body);
    res.status(201).json(worker);
  } catch (e: any) {
    if (e.message === "El RUT ya existe") return res.status(409).json({ error: e.message });
    res.status(400).json({ error: 'Error crear' });
  }
};

// --- MOVILIDAD ---
export const analyzeTransfer = async (req: Request, res: Response) => {
  try {
    const { workerId, targetGesId } = req.body;
    const result = await analyzeJobChange(workerId, targetGesId);
    res.json(result);
  } catch (e) { 
      console.error(e); 
      res.status(500).json({ error: 'Error al analizar brechas' }); 
  }
};

export const executeTransfer = async (req: Request, res: Response) => {
  try {
    const { workerId, targetGesId } = req.body;
    res.json(await transferWorker(workerId, targetGesId));
  } catch (e) { res.status(500).json({ error: 'Error al mover trabajador' }); }
};