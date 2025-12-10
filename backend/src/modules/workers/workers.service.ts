import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { getSuggestedBatteries } from '../ges/ges.service';

const prisma = new PrismaClient();

// ... (Las funciones logWorkerEvent, findAllWorkers, findWorkerByRut, getWorkerById déjalas igual) ...
// ... (Para ahorrar espacio, pego solo la función QUE IMPORTA, el resto del archivo no lo toques si ya estaba bien)

// --- NUEVO: FUNCIÓN PARA REGISTRAR EVENTOS ---
export const logWorkerEvent = async (workerId: string, type: string, title: string, details?: string) => {
    await prisma.workerEvent.create({
        data: { workerId, eventType: type, title, details }
    });
};

// --- READ ---
export const findAllWorkers = async () => {
  return await prisma.worker.findMany({
    orderBy: { name: 'asc' },
    include: { company: true, currentGes: true }
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

// 👇 AQUÍ ESTÁ LA MAGIA DEL DEBUG 👇
export const importWorkersDb = async (fileBuffer: Buffer) => {
    console.log("📢 INICIANDO IMPORTACIÓN DE TRABAJADORES...");
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);
    let count = 0;
    
    const defaultCompany = await prisma.company.findFirst();
    if (!defaultCompany) throw new Error("No hay empresas creadas");

    // Imprimir las cabeceras originales del primer row para ver qué llega
    if (rows.length > 0) {
        console.log("👀 Cabeceras originales fila 1:", Object.keys(rows[0]));
    }

    for (const row of rows) {
        const clean: any = {};
        // Limpieza y log de claves
        Object.keys(row).forEach(k => {
            // Quitamos todo lo que no sea letra o numero para limpiar al maximo
            const cleanKey = k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            clean[cleanKey] = row[k];
        });
        
        const rut = clean['rut'];
        const name = clean['nombre'] || clean['trabajador'] || clean['name'] || clean['nombres'];
        
        // Buscamos Cargo
        const cargo = clean['cargo'] || clean['cargos'] || clean['posicion'] || clean['puesto'] || clean['job'] || 'Sin Cargo';
        
        // Buscamos Centro
        // Agregué más variaciones y un log
        const centroRaw = clean['centro'] || clean['centros'] || clean['centrocosto'] || clean['centrodecosto'] || clean['centrodecostos'] || clean['centroscosto'] || clean['cc'] || clean['costcenter'] || clean['centrodetrabajo'];
        
        let costCenterId = null;

        if (centroRaw) {
            // console.log(`🔎 Buscando Centro: "${centroRaw}"`); // Descomenta si quieres mucho spam
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
                console.warn(`⚠️ Centro NO encontrado en BD: "${centroRaw}"`);
            }
        } else {
             // Si quieres ver a quién le falta centro, descomenta esto:
             // console.log(`⚠️ Fila sin dato de centro: ${name}`);
        }
        
        if (rut && name) {
            await prisma.worker.upsert({
                where: { rut: rut.toString() },
                update: { 
                    name: name.toString(),
                    position: cargo.toString(),
                    costCenterId: costCenterId 
                },
                create: { 
                    rut: rut.toString(), 
                    name: name.toString(), 
                    position: cargo.toString(),
                    companyId: defaultCompany.id,
                    costCenterId: costCenterId,
                    employmentStatus: 'NOMINA'
                }
            });
            count++;
        }
    }
    console.log(`✅ FIN IMPORTACIÓN. Procesados: ${count}`);
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