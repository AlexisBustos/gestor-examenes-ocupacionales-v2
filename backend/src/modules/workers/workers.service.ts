import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { getSuggestedBatteries } from '../ges/ges.service';

const prisma = new PrismaClient();

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

// 👇 ACTUALIZADO Y CORREGIDO
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
    // 1. Obtenemos el trabajador antes del cambio para comparar
    const current = await prisma.worker.findUnique({ where: { id } });
    
    // 2. Aplicamos la actualización
    const updated = await prisma.worker.update({ where: { id }, data });

    // 3. Detectamos cambios importantes para la bitácora
    if (current) {
        // A) Cambio de Estado (Tránsito -> Nómina)
        if (current.employmentStatus !== updated.employmentStatus) {
            await logWorkerEvent(id, 'CAMBIO_ESTADO', 
                updated.employmentStatus === 'NOMINA' ? 'Ingreso a Nómina Oficial' : 'Cambio de Estado',
                `Pasó de ${current.employmentStatus} a ${updated.employmentStatus}`
            );
        }

        // B) Cambio de Puesto (Transferencia)
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
      
      // RELACIÓN CORRECTA CON CENTRO DE COSTOS
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

// --- IMPORT (VERSIÓN BLINDADA PARA CENTROS DE COSTOS Y CARGOS) ---
export const importWorkersDb = async (fileBuffer: Buffer) => {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);
    let count = 0;
    
    // Obtenemos la empresa por defecto
    const defaultCompany = await prisma.company.findFirst();
    if (!defaultCompany) throw new Error("No hay empresas creadas");

    for (const row of rows) {
        const clean: any = {};
        // 🔥 Limpieza AGRESIVA de cabeceras: 
        // "Centro de Costos" -> "centrodecostos"
        // " Nombre " -> "nombre"
        Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
            clean[cleanKey] = row[k];
        });
        
        const rut = clean['rut'];
        const name = clean['nombre'] || clean['trabajador'] || clean['name'] || clean['nombres'];
        
        // 1. CARGO: Busca todas las variantes posibles
        const cargo = clean['cargo'] || clean['cargos'] || clean['posicion'] || clean['puesto'] || clean['job'] || 'Sin Cargo';
        
        // 2. CENTRO DE COSTOS: Busca todas las variantes posibles
        // Esto detectará "centro", "centrocosto", "centrodecostos", "cc", "costcenter"
        const centroRaw = clean['centro'] || clean['centrocosto'] || clean['centrodecosto'] || clean['centrodecostos'] || clean['centroscosto'] || clean['cc'] || clean['costcenter'];
        
        let costCenterId = null;

        if (centroRaw) {
            // Buscamos si existe un centro de costos con ese nombre o código en la BD
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
            }
        }
        
        if (rut && name) {
            await prisma.worker.upsert({
                where: { rut: rut.toString() },
                update: { 
                    name: name.toString(),
                    position: cargo.toString(), // Actualiza cargo
                    costCenterId: costCenterId  // Actualiza Centro de Costos
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