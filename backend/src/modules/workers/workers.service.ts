import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { randomUUID } from 'crypto';
import { getSuggestedBatteries } from '../ges/ges.service';
// Importamos ambas funciones de correo
import { sendODIEmail, sendExitExamEmail } from '../../utils/emailSender'; 

const prisma = new PrismaClient();

// =================================================================
// 🤖 EL ROBOT DE AUTOMATIZACIÓN (ODI) - VERSIÓN DEBUG RAYOS X
// =================================================================
const triggerOdiAutomation = async (workerId: string, gesId: string | null) => {
    console.log(`🤖 [ROBOT] ----------------------------------------------------`);
    console.log(`🤖 [ROBOT] INICIANDO SECUENCIA PARA WORKER: ${workerId}`);
    
    if (!gesId) {
        console.log("🤖 [ROBOT] Cancelado: No hay GES ID.");
        return;
    }

    try {
        // 1. Buscamos el trabajador
        const worker = await prisma.worker.findUnique({ where: { id: workerId } });
        if (!worker || !worker.email) {
            console.log(`ℹ️ [ROBOT] Cancelado: Trabajador sin email o no existe.`);
            return;
        }

        // 2. Buscamos el GES y documentos (SIN FILTRO ISACTIVE para ver si existen)
        const gesData = await prisma.ges.findUnique({
            where: { id: gesId },
            include: {
                risks: {
                    include: {
                        risk: { // Este es el Agente de Riesgo (Ej: Ruido)
                            include: {
                                documents: {
                                    // 👁️ OJO: Quitamos temporalmente el filtro isActive: true para depurar
                                    orderBy: { createdAt: 'desc' }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!gesData) {
            console.log("❌ [ROBOT] Error: No se encontró el GES en la BD.");
            return;
        }

        console.log(`🤖 [ROBOT] GES Detectado: "${gesData.name}"`);
        console.log(`🤖 [ROBOT] Riesgos asociados al GES: ${gesData.risks.length}`);

        // 3. Recolectamos documentos
        const docsToSend: any[] = [];
        const riskNames: string[] = [];

        for (const relation of gesData.risks) {
            const risk = relation.risk;
            console.log(`   🔍 Analizando Riesgo: "${risk.name}" (ID: ${risk.id})`);
            console.log(`      📂 Documentos totales encontrados: ${risk.documents.length}`);

            // Buscamos el documento activo manualmente
            const activeDoc = risk.documents.find(d => d.isActive === true);
            const fallbackDoc = risk.documents[0]; // El más reciente (si no hay activos)

            if (activeDoc) {
                console.log(`      ✅ Documento Activo encontrado: ${activeDoc.title}`);
                docsToSend.push(activeDoc);
                riskNames.push(risk.name);
            } else if (fallbackDoc) {
                console.log(`      ⚠️ AVISO: No hay doc activo, usando el más reciente: ${fallbackDoc.title}`);
                docsToSend.push(fallbackDoc);
                riskNames.push(risk.name);
            } else {
                console.log(`      ❌ Este riesgo NO tiene documentos cargados.`);
            }
        }

        if (docsToSend.length === 0) {
            console.log("ℹ️ [ROBOT] RESULTADO: 0 Documentos recolectados. No se envía correo.");
            console.log("💡 TIP: Ve a Gestión Documental y asegúrate de subir un PDF al riesgo.");
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

        console.log(`📨 [ROBOT] Enviando correo a ${worker.email} con ${attachments.length} adjuntos...`);

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
        } catch (e) { }

        console.log(`✅ [ROBOT EXITO] Proceso finalizado correctamente.`);
        console.log(`🤖 [ROBOT] ----------------------------------------------------`);

    } catch (error) {
        console.error("❌ [ROBOT ERROR CRÍTICO]", error);
    }
};

// =================================================================
// SERVICIOS CRUD
// =================================================================

export const logWorkerEvent = async (workerId: string, type: string, title: string, details?: string) => {
    try {
        await prisma.workerEvent.create({ data: { workerId, eventType: type, title, details } });
    } catch (e) { console.error("Error logging event:", e); }
};

// --- READ (ACTUALIZADO PARA FILTROS) ---
export const findAllWorkers = async () => {
  return await prisma.worker.findMany({
    orderBy: { name: 'asc' },
    include: { 
        company: true, 
        costCenter: true,
        // 👇 CAMBIO IMPORTANTE: Traemos GES y Riesgos para poder filtrar en el Frontend
        currentGes: {
            include: {
                risks: {
                    include: { risk: true }
                }
            }
        }
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
            include: { document: { include: { agent: true } } },
            orderBy: { sentAt: 'desc' }
        },
        examOrders: { 
            orderBy: { createdAt: 'desc' },
            include: { 
                ges: true,
                orderBatteries: { include: { battery: true } }
            }
        },
        exposureHistory: {
            orderBy: { startDate: 'desc' },
            include: { 
                company: true,
                ges: {
                    include: {
                        riskExposures: { include: { riskAgent: true } }
                    }
                }
            }
        }
    }
  });
};

// --- UPDATE (LÓGICA BLINDADA & CORREGIDA PARA EMPRESA) ---
export const updateWorker = async (id: string, data: any) => {
    // 👇 CAMBIO 1: Traemos la empresa (company: true)
    const current = await prisma.worker.findUnique({ 
        where: { id },
        include: { company: true } 
    });
    
    // A. LÓGICA DESVINCULACIÓN (SMART TERMINATION)
    if (current && data.employmentStatus === 'DESVINCULADO' && current.employmentStatus !== 'DESVINCULADO') {
        console.log(`🔄 [SMART TERMINATION] Iniciando proceso de egreso...`);
        const currentExposure = await prisma.exposureHistory.findFirst({
            where: { workerId: id, isActive: true },
            include: { ges: { include: { riskExposures: { include: { riskAgent: true } } } } }
        });

        if (currentExposure) {
            await prisma.exposureHistory.update({
                where: { id: currentExposure.id },
                data: { isActive: false, endDate: new Date() }
            });

            const riskList = currentExposure.ges.riskExposures.map(re => re.riskAgent.name);
            
            if (current.email && riskList.length > 0) {
                // 👇 CAMBIO 2: Usamos el nombre real de la empresa
                const companyName = current.company?.name || "Su Empresa";

                await sendExitExamEmail(current.email, current.name, companyName, riskList);
                
                await logWorkerEvent(id, 'EGRESO', 'Desvinculación y Aviso Legal', `Notificado por: ${riskList.join(', ')}`);
                console.log("✅ [SMART TERMINATION] Correo enviado.");
            }
        }
    }

    // B. UPDATE NORMAL
    const updated = await prisma.worker.update({ where: { id }, data });
    
    if (current) {
        // C. MOVILIDAD (Cambio de puesto o empresa en Nómina)
        if (updated.employmentStatus === 'NOMINA' && data.employmentStatus !== 'DESVINCULADO') {
            const isJobChange = (data.currentGesId && data.currentGesId !== current.currentGesId);
            const isCompanyChange = (data.companyId && data.companyId !== current.companyId);

            if (isJobChange || isCompanyChange) {
                await prisma.exposureHistory.updateMany({
                    where: { workerId: id, isActive: true },
                    data: { isActive: false, endDate: new Date() }
                });

                if (updated.currentGesId && updated.companyId) {
                    await prisma.exposureHistory.create({
                        data: {
                            workerId: id,
                            companyId: updated.companyId,
                            gesId: updated.currentGesId,
                            startDate: new Date(),
                            isActive: true
                        }
                    });
                }
            }
        }

        // --- ROBOT ODI ---
        let robotTriggered = false;

        // Caso 1: Ingreso a Nómina
        if (current.employmentStatus !== 'NOMINA' && updated.employmentStatus === 'NOMINA') {
            await logWorkerEvent(id, 'CAMBIO_ESTADO', 'Ingreso a Nómina Oficial');
            if (updated.currentGesId && !robotTriggered) {
                triggerOdiAutomation(updated.id, updated.currentGesId);
                robotTriggered = true;
            }
        } 
        
        // Caso 2: Cambio de Puesto (estando ya en nómina)
        if (current.currentGesId !== updated.currentGesId && updated.employmentStatus === 'NOMINA') {
            const newGes = updated.currentGesId ? await prisma.ges.findUnique({ where: { id: updated.currentGesId }}) : null;
            await logWorkerEvent(id, 'CAMBIO_PUESTO', 'Cambio de Puesto', `Nuevo puesto: ${newGes?.name}`);
            
            if (updated.currentGesId && !robotTriggered) {
                triggerOdiAutomation(updated.id, updated.currentGesId);
                robotTriggered = true;
            }
        }
    }
    return updated;
};

export const deleteWorker = async (id: string) => {
    return await prisma.worker.delete({ where: { id } });
};

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

  if (newWorker.currentGesId) {
      await prisma.exposureHistory.create({
          data: {
              workerId: newWorker.id,
              companyId: newWorker.companyId,
              gesId: newWorker.currentGesId,
              startDate: new Date(),
              isActive: true
          }
      });
  }

  await logWorkerEvent(newWorker.id, 'CREACION', 'Creación de Ficha', initialStatus === 'TRANSITO' ? 'Ingresa como Candidato' : 'Ingresa directo a Nómina');

  if (initialStatus === 'NOMINA' && newWorker.currentGesId) {
      triggerOdiAutomation(newWorker.id, newWorker.currentGesId);
  }

  return newWorker;
};

// ... (Resto de funciones de Import y Movilidad sin cambios)
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
        const name = clean['nombre'] || clean['trabajador'] || clean['name'];
        const cargo = clean['cargo'] || clean['posicion'];
        const email = clean['email'] || clean['correo'];
        const phone = clean['phone'] || clean['telefono'];
        const centroRaw = clean['centro'] || clean['centros'] || clean['cc'];
        
        let costCenterId = null;
        if (centroRaw) {
            const foundCC = await prisma.costCenter.findFirst({
                where: { OR: [{ name: { equals: centroRaw.toString(), mode: 'insensitive' } }, { code: { equals: centroRaw.toString(), mode: 'insensitive' } }] }
            });
            if (foundCC) costCenterId = foundCC.id;
        }

        const empresaRaw = clean['empresa'] || clean['company'];
        let targetCompanyId = defaultCompany.id;
        if (empresaRaw) {
            const foundComp = await prisma.company.findFirst({
                where: { OR: [{ name: { equals: empresaRaw.toString(), mode: 'insensitive' } }, { rut: { equals: empresaRaw.toString(), mode: 'insensitive' } }] }
            });
            if (foundComp) targetCompanyId = foundComp.id;
        }
        
        if (rut && name) {
            const updateData: any = { name: name.toString(), companyId: targetCompanyId };
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
    console.log(`✅ Importación finalizada.`);
    return { message: `Nómina procesada (${count} registros).` };
};

export const analyzeJobChange = async (workerId: string, newGesId: string) => {
    const worker: any = await prisma.worker.findUnique({
        where: { id: workerId },
        include: { currentGes: true, examOrders: { include: { orderBatteries: { where: { status: 'APTO' }, include: { battery: true } } } } }
    });
    const newGes = await prisma.ges.findUnique({ where: { id: newGesId } });
    if (!worker || !newGes) throw new Error("Datos no encontrados");
    const requiredBatteries = await getSuggestedBatteries(newGesId);
    const myPassedExamIds = new Set();
    if (worker.examOrders) worker.examOrders.forEach((order: any) => { if (order.orderBatteries) order.orderBatteries.forEach((item: any) => myPassedExamIds.add(item.batteryId)); });
    
    const gaps = requiredBatteries.map((battery: any) => ({
        batteryId: battery.id,
        name: battery.name,
        status: myPassedExamIds.has(battery.id) ? 'CUBIERTO' : 'FALTA'
    }));

    return { 
        worker: { currentGesName: worker.currentGes?.name }, 
        newGes: { name: newGes.name }, 
        gaps: gaps, 
        transferReady: !gaps.some((g: any) => g.status === 'FALTA') 
    };
};

export const transferWorker = async (workerId: string, newGesId: string) => {
    return await updateWorker(workerId, { currentGesId: newGesId });
};