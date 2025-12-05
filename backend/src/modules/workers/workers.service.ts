import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { getSuggestedBatteries } from '../ges/ges.service'; // Importamos la inteligencia del GES

const prisma = new PrismaClient();

// --- FUNCIONES BÁSICAS (MANTENIDAS) ---
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

export const updateWorker = async (id: string, data: any) => {
    return await prisma.worker.update({ where: { id }, data });
};

export const deleteWorker = async (id: string) => {
    return await prisma.worker.delete({ where: { id } });
};

// --- EN workers.service.ts (Reemplaza la función createWorkerDb existente) ---

export const createWorkerDb = async (data: any) => {
  const exists = await prisma.worker.findUnique({ where: { rut: data.rut } });
  
  // Si ya existe, lo devolvemos tal cual (no cambiamos su estado a TRANSITO si ya era NOMINA)
  if (exists) return exists; 

  let companyId = data.companyId;
  if (!companyId) {
      const defaultComp = await prisma.company.findFirst();
      if (!defaultComp) throw new Error("No hay empresas");
      companyId = defaultComp.id;
  }

  // LÓGICA DEL SEMÁFORO:
  // Si nos dicen explícitamente que es PRE_OCUPACIONAL, entra en TRANSITO.
  // Si no dicen nada, asumimos NOMINA (por seguridad).
  const initialStatus = (data.evaluationType === 'PRE_OCUPACIONAL') 
                        ? 'TRANSITO' 
                        : 'NOMINA';

  return await prisma.worker.create({
    data: {
      rut: data.rut,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position || 'Sin Cargo',
      costCenter: data.costCenter,
      companyId: companyId,
      active: true,
      employmentStatus: initialStatus // <--- AQUÍ ESTÁ LA MAGIA
    }
  });
};

export const importWorkersDb = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  let count = 0;
  const defaultCompany = await prisma.company.findFirst();
  if (!defaultCompany) throw new Error("No hay empresas creadas");

  for (const row of rows) {
    const clean: any = {};
    Object.keys(row).forEach(k => clean[k.toLowerCase().trim()] = row[k]);
    const rut = clean['rut'];
    const name = clean['nombre'] || clean['trabajador'];
    const cargo = clean['cargo'] || clean['puesto'];
    const centroCosto = clean['centro costo'] || clean['cc'];
    const email = clean['email'] || clean['correo'];
    const phone = clean['telefono'] || clean['fono'];

    if (rut && name) {
      await prisma.worker.upsert({
        where: { rut: rut.toString() },
        update: { name: name.toString(), position: cargo, costCenter: centroCosto, email, phone: phone?.toString(), active: true },
        create: { rut: rut.toString(), name: name.toString(), position: cargo || 'Sin Cargo', costCenter: centroCosto, email, phone: phone?.toString(), companyId: defaultCompany.id, active: true }
      });
      count++;
    }
  }
  return { message: `Nómina procesada: ${count} trabajadores.` };
};

// --- NUEVA LÓGICA: MOVILIDAD V1.1 ---

export const analyzeJobChange = async (workerId: string, newGesId: string) => {
  // 1. Qué pide el nuevo puesto
  const requiredBatteries = await getSuggestedBatteries(newGesId);
  
  // 2. Qué tiene el trabajador (APTO y VIGENTE)
  const workerHistory = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      currentGes: true,
      examOrders: {
        include: {
          orderBatteries: {
            where: {
              status: 'APTO', // Solo APTOS
              // expirationDate: { gt: new Date() } // (Opcional: Activar si quieres validar fechas)
            },
            include: { battery: true }
          }
        }
      }
    }
  });

  if (!workerHistory) throw new Error("Trabajador no encontrado");

  const newGes = await prisma.ges.findUnique({ where: { id: newGesId } });
  if (!newGes) throw new Error("GES destino no encontrado");

  // Aplanar historial
  const currentBatteriesIds = new Set<string>();
  workerHistory.examOrders.forEach(order => {
    order.orderBatteries.forEach(ob => currentBatteriesIds.add(ob.batteryId));
  });

  // 3. Calcular Brecha
  const gaps = requiredBatteries.map((reqBat: any) => {
    const hasIt = currentBatteriesIds.has(reqBat.id);
    return {
      batteryId: reqBat.id,
      name: reqBat.name,
      status: hasIt ? 'CUBIERTO' : 'FALTANTE'
    };
  });

  return {
    worker: {
        id: workerHistory.id,
        name: workerHistory.name,
        currentGesName: workerHistory.currentGes?.name || 'Sin asignar'
    },
    newGes: {
        id: newGes.id,
        name: newGes.name
    },
    gaps,
    transferReady: gaps.every((g: any) => g.status === 'CUBIERTO')
  };
};

export const transferWorker = async (workerId: string, newGesId: string) => {
  return await prisma.worker.update({
    where: { id: workerId },
    data: { currentGesId: newGesId }
  });
};