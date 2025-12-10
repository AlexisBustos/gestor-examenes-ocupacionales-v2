import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { getSuggestedBatteries } from '../ges/ges.service';

const prisma = new PrismaClient();

// --- LOGGING ---
export const logWorkerEvent = async (workerId: string, type: string, title: string, details?: string) => {
    await prisma.workerEvent.create({
        data: { workerId, eventType: type, title, details }
    });
};

// --- READ (Con CostCenter incluido) ---
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

// --- UPDATE ---
export const updateWorker = async (id: string, data: any) => {
    const current = await prisma.worker.findUnique({ where: { id } });
    const updated = await prisma.worker.update({ where: { id }, data });
    
    if (current) {
        if (current.employmentStatus !== updated.employmentStatus) {
            await logWorkerEvent(id, 'CAMBIO_ESTADO', 
                updated.employmentStatus === 'NOMINA' ? 'Ingreso a Nómina Oficial' : 'Cambio de Estado',
                `Pasó de ${current.employmentStatus} a ${updated.employmentStatus}`
            );
        }
        if (current.currentGesId !== updated.currentGesId) {
            const newGes = updated.currentGesId ? await prisma.ges.findUnique({ where: { id: updated.currentGesId }}) : null;
            await logWorkerEvent(id, 'CAMBIO_PUESTO', 
                'Cambio de Puesto de Trabajo',
                `Nuevo puesto asignado: ${newGes?.name || 'Sin asignar'}`
            );
        }
    }
    return updated;
};

export const deleteWorker = async (id: string) => {
    return await prisma.worker.delete({ where: { id } });
};

// --- CREATE ---
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
      employmentStatus: initialStatus
    }
  });

  await logWorkerEvent(newWorker.id, 'CREACION', 'Creación de Ficha', 
      initialStatus === 'TRANSITO' ? 'Ingresa como Candidato (En Tránsito)' : 'Ingresa directo a Nómina');

  return newWorker;
};

// 👇 IMPORTACIÓN BLINDADA (Lógica simplificada y robusta)
export const importWorkersDb = async (fileBuffer: Buffer) => {
    console.log("📢 INICIANDO PROCESO DE CARGA...");
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);
    let count = 0;
    
    const defaultCompany = await prisma.company.findFirst();
    if (!defaultCompany) throw new Error("No hay empresas creadas");

    if (rows.length > 0) {
        // Log para ver qué está leyendo realmente el servidor
        console.log("👀 Cabeceras detectadas:", Object.keys(rows[0]));
    }

    for (const row of rows) {
        const clean: any = {};
        
        // 1. Limpieza SIMPLE de claves (Solo minúsculas y quitar espacios)
        // "Centro de Costos" -> "centrodecostos"
        Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().trim().replace(/\s+/g, '');
            clean[cleanKey] = row[k];
        });
        
        const rut = clean['rut'];
        const name = clean['nombre'] || clean['trabajador'] || clean['name'] || clean['nombres'];
        
        // 2. Mapeo de datos (con múltiples opciones)
        const cargo = clean['cargo'] || clean['cargos'] || clean['posicion'] || clean['puesto'] || clean['job'];
        const email = clean['email'] || clean['correo'] || clean['mail'] || clean['correoelectronico'];
        const phone = clean['phone'] || clean['telefono'] || clean['celular'] || clean['movil'];
        
        // 3. CENTRO DE COSTOS
        // Busca cualquier variante probable
        const centroRaw = clean['centro'] || clean['centros'] || clean['centrocosto'] || clean['centrodecosto'] || clean['centrodecostos'] || clean['centroscosto'] || clean['cc'] || clean['costcenter'] || clean['centrodetrabajo'];
        
        let costCenterId = null;

        if (centroRaw) {
            // console.log(`🔎 Buscando CC: ${centroRaw}`);
            const foundCC = await prisma.costCenter.findFirst({
                where: {
                    OR: [
                        { name: { equals: centroRaw.toString(), mode: 'insensitive' } },
                        { code: { equals: centroRaw.toString(), mode: 'insensitive' } }
                    ]
                }
            });
            if (foundCC) {
                costCenterId = foundCC.id;
            } else {
                console.warn(`⚠️ CC no encontrado: "${centroRaw}"`);
            }
        }
        
        if (rut && name) {
            // Preparamos objeto de actualización (solo campos que traigan datos)
            const updateData: any = { name: name.toString() };
            if (cargo) updateData.position = cargo.toString();
            if (costCenterId) updateData.costCenterId = costCenterId;
            if (email) updateData.email = email.toString();
            if (phone) updateData.phone = phone.toString();

            await prisma.worker.upsert({
                where: { rut: rut.toString() },
                update: updateData, // Solo actualiza si hay datos nuevos
                create: { 
                    rut: rut.toString(), 
                    name: name.toString(), 
                    position: cargo ? cargo.toString() : 'Sin Cargo',
                    companyId: defaultCompany.id,
                    costCenterId: costCenterId,
                    email: email ? email.toString() : null,
                    phone: phone ? phone.toString() : null,
                    employmentStatus: 'NOMINA'
                }
            });
            count++;
        }
    }
    console.log(`✅ FIN PROCESO. Actualizados/Creados: ${count}`);
    return { message: `Nómina procesada (${count} registros).` };
};

// ... (Las funciones de movilidad déjalas igual) ...
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

    const newGes = await prisma.ges.findUnique({
        where: { id: newGesId }
    });

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