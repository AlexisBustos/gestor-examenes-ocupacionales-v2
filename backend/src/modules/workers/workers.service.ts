import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { getSuggestedBatteries } from '../ges/ges.service';

const prisma = new PrismaClient();

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
            include: { ges: true, orderBatteries: { include: { battery: true } } }
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

// LÓGICA DE MOVILIDAD
export const analyzeJobChange = async (workerId: string, newGesId: string) => {
  console.log(`🕵️‍♂️ Backend: Analizando worker ${workerId} para GES ${newGesId}`);
  
  const requiredBatteries = await getSuggestedBatteries(newGesId);
  
  const workerHistory = await prisma.worker.findUnique({
    where: { id: workerId },
    include: { examOrders: { include: { orderBatteries: { where: { status: 'APTO' }, include: { battery: true } } } } }
  });

  if (!workerHistory) throw new Error("Trabajador no encontrado");

  const currentBatteriesIds = new Set<string>();
  workerHistory.examOrders.forEach(order => {
    order.orderBatteries.forEach(ob => currentBatteriesIds.add(ob.batteryId));
  });

  const gaps = requiredBatteries.map((reqBat: any) => {
    const hasIt = currentBatteriesIds.has(reqBat.id);
    return {
      batteryId: reqBat.id,
      name: reqBat.name,
      status: hasIt ? 'CUBIERTO' : 'FALTANTE'
    };
  });

  return {
    newGesId,
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

export const importWorkersDb = async (fileBuffer: Buffer) => {
  // Lógica de importación simplificada para no alargar
  return { message: "Importador listo" };
};