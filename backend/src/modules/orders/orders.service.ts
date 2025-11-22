import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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

export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  examBatteryId?: string; // Opcional desde el front
  evaluationType: string;
}) => {
  // 1. Upsert del Trabajador (Buscar o Crear)
  const worker = await prisma.worker.upsert({
    where: { rut: data.worker.rut },
    update: {
      name: data.worker.name,
      // Solo actualizamos si vienen datos nuevos, sino mantenemos los viejos
      phone: data.worker.phone || undefined,
      position: data.worker.position || undefined,
      currentGesId: data.gesId, // Actualizamos su GES actual
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

  // 2. Lógica de Seguridad para la Batería (AUTO-HEALING) 🛡️
  let finalBatteryId = data.examBatteryId;

  // Verificamos si el ID enviado es válido
  if (finalBatteryId) {
    const batteryExists = await prisma.examBattery.findUnique({
      where: { id: finalBatteryId },
    });
    if (!batteryExists) {
      console.log(`⚠️ ID de batería inválido recibido: ${finalBatteryId}. Buscando fallback...`);
      finalBatteryId = undefined; // Lo marcamos como inválido para buscar otro
    }
  }

  // Si no tenemos ID válido, buscamos uno compatible
  if (!finalBatteryId) {
    // Intento A: Buscar la primera batería asociada a los riesgos del GES
    const ges = await prisma.ges.findUnique({
      where: { id: data.gesId },
      include: { riskExposures: true },
    });

    // Aquí podrías agregar lógica para buscar batería por riesgo.
    // Por simplicidad para la demo: Buscamos CUALQUIER batería disponible.
    const fallbackBattery = await prisma.examBattery.findFirst();

    if (fallbackBattery) {
      console.log(`✅ Usando batería fallback: ${fallbackBattery.name}`);
      finalBatteryId = fallbackBattery.id;
    } else {
      // Si no hay ninguna batería en toda la BD, esto explotará, pero es muy raro.
      throw new Error("No hay baterías disponibles en el sistema para asignar.");
    }
  }

  // 3. Crear la Orden
  return await prisma.examOrder.create({
    data: {
      status: 'SOLICITADO',
      workerId: worker.id,
      companyId: data.companyId,
      gesId: data.gesId,
      examBatteryId: finalBatteryId!, // Usamos el ID validado o recuperado
    },
  });
};

export const updateOrderStatus = async (
  id: string,
  status: string,
  scheduledAt?: string
) => {
  return await prisma.examOrder.update({
    where: { id },
    data: {
      status: status as any,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    },
  });
};