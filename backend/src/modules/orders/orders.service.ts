import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener lista
export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status
    ? { status: status as any }
    : {};

  return await prisma.examOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: true,
      company: true,
      examBattery: true,
      ges: true,
    },
  });
};

// Crear Orden (Con Upsert Worker y Auto-Healing Battery)
export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  examBatteryId?: string;
  evaluationType: string;
}) => {
  
  // 1. Gestionar Trabajador
  const worker = await prisma.worker.upsert({
    where: { rut: data.worker.rut },
    update: {
      name: data.worker.name,
      phone: data.worker.phone || undefined,
      position: data.worker.position || undefined,
      currentGesId: data.gesId,
    },
    create: {
      rut: data.worker.rut,
      name: data.worker.name,
      phone: data.worker.phone,
      position: data.worker.position || 'Sin Cargo',
      companyId: data.companyId,
      currentGesId: data.gesId,
    },
  });

  // 2. Gestionar Batería (Fallback)
  let finalBatteryId = data.examBatteryId;

  if (finalBatteryId) {
    const batteryExists = await prisma.examBattery.findUnique({ where: { id: finalBatteryId } });
    if (!batteryExists) finalBatteryId = undefined;
  }

  if (!finalBatteryId) {
    const fallbackBattery = await prisma.examBattery.findFirst();
    if (fallbackBattery) {
      finalBatteryId = fallbackBattery.id;
    } else {
      throw new Error("No hay baterías disponibles en el sistema.");
    }
  }

  // 3. Crear Orden
  return await prisma.examOrder.create({
    data: {
      status: 'SOLICITADO',
      workerId: worker.id,
      companyId: data.companyId,
      gesId: data.gesId,
      examBatteryId: finalBatteryId!,
    },
  });
};

// Actualizar Estado (Agendar)
export const updateOrderStatus = async (
  id: string,
  status: string,
  scheduledAt?: string,
  providerName?: string, // <--- Nuevos parámetros
  externalId?: string
) => {
  return await prisma.examOrder.update({
    where: { id },
    data: {
      status: status as any,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      providerName: providerName, // Guardamos proveedor
      externalId: externalId      // Guardamos folio
    },
  });
};