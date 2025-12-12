import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { randomUUID } from 'crypto';
import { getSuggestedBatteries } from '../ges/ges.service';
import { sendODIEmail } from '../../utils/emailSender';

const prisma = new PrismaClient();

// =================================================================
// 🤖 EL ROBOT DE AUTOMATIZACIÓN (ODI) - VERSIÓN PRODUCCIÓN
// =================================================================
const triggerOdiAutomation = async (workerId: string, gesId: string | null) => {
    // Solo logueamos el inicio para trazabilidad mínima
    console.log(`🤖 [ROBOT] Procesando WorkerID: ${workerId}`);
    
    if (!gesId) return;

    try {
        // 1. Buscamos el trabajador
        const worker = await prisma.worker.findUnique({ where: { id: workerId } });
        if (!worker || !worker.email) {
            console.log(`ℹ️ [ROBOT] Omitido: Trabajador ${workerId} sin email.`);
            return;
        }

        // 2. Buscamos el GES y documentos ACTIVOS
        const gesData = await prisma.ges.findUnique({
            where: { id: gesId },
            include: {
                risks: {
                    include: {
                        risk: {
                            include: {
                                documents: {
                                    where: { isActive: true },
                                    orderBy: { createdAt: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!gesData) return;

        // 3. Recolectamos documentos
        const docsToSend: any[] = [];
        const riskNames: string[] = [];

        for (const relation of gesData.risks) {
            const risk = relation.risk;
            if (risk.documents.length > 0) {
                docsToSend.push(risk.documents[0]);
                riskNames.push(risk.name);
            }
        }

        if (docsToSend.length === 0) {
            console.log("ℹ️ [ROBOT] El puesto no tiene documentos configurados. No se envía correo.");
            return;
        }

        // 4. Generamos Tokens y Registramos
        const deliveryToken = randomUUID();

        for (const doc of docsToSend) {
            await prisma.odiDelivery.create({
                data: {
                    workerId: worker.id,
                    documentId: doc.id,
                    token: deliveryToken,
                    status: 'PENDING',
                    sentAt: new Date()
                }
            });
        }

        // 5. Enviamos Correo
        const attachments = docsToSend.map(d => ({
            filename: d.title,
            path: d.publicUrl
        }));

        await sendODIEmail(
            worker.email,
            worker.name,
            worker.companyId ? "Empresa" : "Vitam", 
            riskNames,
            attachments,
            deliveryToken
        );

        // 6. Huella en el historial
        try {
            await logWorkerEvent(worker.id, 'ENVIO_ODI', 'Envío Automático ODI', 
                `Se enviaron ${docsToSend.length} documentos legales.`);
        } catch (e) { /* Silencio si falla el log, lo importante es el correo */ }

        console.log(`✅ [ROBOT EXITO] Correo enviado a ${worker.email} (${docsToSend.length} docs)`);

    } catch (error) {
        console.error("❌ [ROBOT ERROR]", error);
    }
};

// =================================================================
// SERVICIOS CRUD
// =================================================================

// --- LOGGING ---
export const logWorkerEvent = async (workerId: string, type: string, title: string, details?: string) => {
    try {
        await prisma.workerEvent.create({
            data: { workerId, eventType: type, title, details }
        });
    } catch (e) {
        console.error("Error logging event:", e);
    }
};

// --- READ ---
export const findAllWorkers = async () => {
  return await prisma.worker.findMany({
    orderBy: { name: 'asc' },
    include: { 
        company: true, 
        currentGes: true, 
        costCenter: true 
    }
  });
};

export const findWorkerByRut = async (rut: string) => {
  return await prisma.worker.findUnique({
    where: { rut },
    include: { company: true, currentGes: true }
  });
};

export const getWorkerById = async (id: string) => {
  return await prisma.worker.findUnique({
    where: { id },
    include: { 
        company: true, 
        currentGes: true, 
        costCenter: true, 
        events: { orderBy: { createdAt: 'desc' } }, 
        odiDeliveries: {
            include: { 
                document: { include: { agent: true } } 
            },
            orderBy: { sentAt: 'desc' }
        },
        examOrders: { 
            orderBy: { createdAt: 'desc' },
            include: { 
                ges: true,
                orderBatteries: { include: { battery: true } }
            }
        }
    }
  });
};

// --- UPDATE (Limpio) ---
export const updateWorker = async (id: string, data: any) => {
    const current = await prisma.worker.findUnique({ where: { id } });
    const updated = await prisma.worker.update({ where: { id }, data });
    
    if (current) {
        // DETECCIÓN 1: Cambio de Estado a NÓMINA
        if (current.employmentStatus !== 'NOMINA' && updated.employmentStatus === 'NOMINA') {
            await logWorkerEvent(id, 'CAMBIO_ESTADO', 'Ingreso a Nómina Oficial', `Pasó de ${current.employmentStatus} a NOMINA`);
            
            // Robot
            if (updated.currentGesId) {
                triggerOdiAutomation(updated.id, updated.currentGesId);
            }
        } 
        // DETECCIÓN 2: Cambio genérico
        else if (current.employmentStatus !== updated.employmentStatus) {
             await logWorkerEvent(id, 'CAMBIO_ESTADO', 'Cambio de Estado', `Pasó de ${current.employmentStatus} a ${updated.employmentStatus}`);
        }

        // DETECCIÓN 3: Cambio de Puesto (Si ya es Nómina y cambia de GES)
        if (current.currentGesId !== updated.currentGesId) {
            const newGes = updated.currentGesId ? await prisma.ges.findUnique({ where: { id: updated.currentGesId }}) : null;
            await logWorkerEvent(id, 'CAMBIO_PUESTO', 
                'Cambio de Puesto de Trabajo',
                `Nuevo puesto asignado: ${newGes?.name || 'Sin asignar'}`
            );

            // Robot
            if (updated.employmentStatus === 'NOMINA' && updated.currentGesId) {
                triggerOdiAutomation(updated.id, updated.currentGesId);
            }
        }
    }
    return updated;
};

export const deleteWorker = async (id: string) => {
    return await prisma.worker.delete({ where: { id } });
};

// --- CREATE (Limpio) ---
export const createWorkerDb = async (data: any) => {
  const exists = await prisma.worker.findUnique({ where: { rut: data.rut } });
  if (exists) return exists; 

  let companyId = data.companyId;
  if (!companyId) {
      const defaultComp = await prisma.company.findFirst();
      if (!defaultComp) throw new Error("No hay empresas");
      companyId = defaultComp.id;
  }

  const initialStatus = (data.evaluationType === 'PRE_OCUPACIONAL') ? 'TRANSITO' : 'NOMINA';

  const newWorker = await prisma.worker.create({
    data: {
      rut: data.rut,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position || 'Sin Cargo',
      costCenterId: data.costCenterId ? data.costCenterId : null,
      companyId: companyId,
      active: true,
      employmentStatus: initialStatus,
      currentGesId: data.currentGesId || null
    }
  });

  await logWorkerEvent(newWorker.id, 'CREACION', 'Creación de Ficha', 
      initialStatus === 'TRANSITO' ? 'Ingresa como Candidato (En Tránsito)' : 'Ingresa directo a Nómina');

  // Robot (Si nace directo en Nómina)
  if (initialStatus === 'NOMINA' && newWorker.currentGesId) {
      triggerOdiAutomation(newWorker.id, newWorker.currentGesId);
  }

  return newWorker;
};

// --- IMPORT (Limpio) ---
export const importWorkersDb = async (fileBuffer: Buffer) => {
    console.log("📢 Procesando carga masiva de trabajadores...");
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);
    let count = 0;
    
    const defaultCompany = await prisma.company.findFirst();
    if (!defaultCompany) throw new Error("No hay empresas creadas");

    for (const row of rows) {
        const clean: any = {};
        Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().trim().replace(/\s+/g, '');
            clean[cleanKey] = row[k];
        });
        
        const rut = clean['rut'];
        const name = clean['nombre'] || clean['trabajador'] || clean['name'] || clean['nombres'];
        const cargo = clean['cargo'] || clean['cargos'] || clean['posicion'] || clean['puesto'] || clean['job'];
        const email = clean['email'] || clean['correo'] || clean['mail'] || clean['correoelectronico'];
        const phone = clean['phone'] || clean['telefono'] || clean['celular'] || clean['movil'];
        
        const centroRaw = clean['centro'] || clean['centros'] || clean['centrocosto'] || clean['cc'] || clean['costcenter'] || clean['centrodetrabajo'];
        
        let costCenterId = null;
        if (centroRaw) {
            const foundCC = await prisma.costCenter.findFirst({
                where: {
                    OR: [
                        { name: { equals: centroRaw.toString(), mode: 'insensitive' } },
                        { code: { equals: centroRaw.toString(), mode: 'insensitive' } }
                    ]
                }
            });
            if (foundCC) costCenterId = foundCC.id;
        }

        const empresaRaw = clean['empresa'] || clean['company'] || clean['razonsocial'] || clean['emp'];
        let targetCompanyId = defaultCompany.id;

        if (empresaRaw) {
            const foundComp = await prisma.company.findFirst({
                where: {
                    OR: [
                        { name: { equals: empresaRaw.toString(), mode: 'insensitive' } },
                        { rut: { equals: empresaRaw.toString(), mode: 'insensitive' } }
                    ]
                }
            });
            
            if (foundComp) {
                targetCompanyId = foundComp.id;
            } else {
                console.warn(`⚠️ Empresa no encontrada en importación: "${empresaRaw}". Se usará la default.`);
            }
        }
        
        if (rut && name) {
            const updateData: any = { 
                name: name.toString(),
                companyId: targetCompanyId 
            };
            
            if (cargo) updateData.position = cargo.toString();
            if (costCenterId) updateData.costCenterId = costCenterId;
            if (email) updateData.email = email.toString();
            if (phone) updateData.phone = phone.toString();

            await prisma.worker.upsert({
                where: { rut: rut.toString() },
                update: updateData, 
                create: { 
                    rut: rut.toString(), 
                    name: name.toString(), 
                    position: cargo ? cargo.toString() : 'Sin Cargo',
                    companyId: targetCompanyId, 
                    costCenterId: costCenterId,
                    email: email ? email.toString() : null,
                    phone: phone ? phone.toString() : null,
                    employmentStatus: 'NOMINA'
                }
            });
            count++;
        }
    }
    console.log(`✅ Importación finalizada. ${count} registros procesados.`);
    return { message: `Nómina procesada (${count} registros).` };
};

// --- MOVILIDAD ---
export const analyzeJobChange = async (workerId: string, newGesId: string) => {
    const worker: any = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            currentGes: true,
            examOrders: {
                include: {
                    orderBatteries: {
                        where: { status: 'APTO' },
                        include: { battery: true }
                    }
                }
            }
        }
    });

    const newGes = await prisma.ges.findUnique({ where: { id: newGesId } });
    if (!worker || !newGes) throw new Error("Trabajador o GES no encontrado");

    const requiredBatteries = await getSuggestedBatteries(newGesId);
    const myPassedExamIds = new Set();
    
    if (worker.examOrders) {
        worker.examOrders.forEach((order: any) => {
            if (order.orderBatteries) {
                order.orderBatteries.forEach((item: any) => {
                    myPassedExamIds.add(item.batteryId);
                });
            }
        });
    }

    const gaps = requiredBatteries.map((battery: any) => {
        const isCovered = myPassedExamIds.has(battery.id);
        return {
            batteryId: battery.id,
            name: battery.name,
            status: isCovered ? 'CUBIERTO' : 'FALTA'
        };
    });

    const transferReady = !gaps.some(g => g.status === 'FALTA');

    return {
        worker: { currentGesName: worker.currentGes?.name },
        newGes: { name: newGes.name },
        gaps: gaps,
        transferReady: transferReady
    };
};

export const transferWorker = async (workerId: string, newGesId: string) => {
    return await updateWorker(workerId, { currentGesId: newGesId });
};