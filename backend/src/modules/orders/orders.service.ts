import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status ? { status: status as any } : {};
  return await prisma.examOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: true,
      company: true,
      examBatteries: true, // <--- AHORA TRAEMOS LA LISTA
      ges: true,
    },
  });
};

export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  examBatteryId?: string; // (Ignorado o usado como hint)
  evaluationType: string;
}) => {
  
  // 1. Upsert Trabajador
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

  // 2. LÓGICA MULTI-BATERÍA 🧠
  // Buscamos el GES y sus riesgos para ver qué baterías tocan
  const ges = await prisma.ges.findUnique({
    where: { id: data.gesId },
    include: { 
        riskExposures: { include: { riskAgent: true } } 
    }
  });

  let batteriesToConnect: { id: string }[] = [];

  if (ges && ges.riskExposures) {
    for (const riskExp of ges.riskExposures) {
        // Buscamos baterías que coincidan con el nombre del riesgo (ej: Riesgo "Ruido" -> Batería "Ruido")
        const battery = await prisma.examBattery.findFirst({
            where: {
                name: { contains: riskExp.riskAgent.name, mode: 'insensitive' }
            }
        });
        if (battery) {
            batteriesToConnect.push({ id: battery.id });
        }
    }
  }

  // Si no encontramos ninguna inteligente, buscamos fallback
  if (batteriesToConnect.length === 0) {
      const fallback = await prisma.examBattery.findFirst();
      if (fallback) batteriesToConnect.push({ id: fallback.id });
  }

  // Eliminar duplicados
  batteriesToConnect = [...new Map(batteriesToConnect.map(item => [item['id'], item])).values()];

  console.log(`🔗 Conectando ${batteriesToConnect.length} baterías a la orden.`);

  // 3. Crear Orden
  return await prisma.examOrder.create({
    data: {
      status: 'SOLICITADO',
      workerId: worker.id,
      companyId: data.companyId,
      gesId: data.gesId,
      // Conexión Múltiple
      examBatteries: {
          connect: batteriesToConnect
      }
    },
  });
};

export const updateOrderStatus = async (id: string, status: string, scheduledAt?: string, providerName?: string, externalId?: string) => {
  return await prisma.examOrder.update({
    where: { id },
    data: {
      status: status as any,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      providerName,
      externalId
    },
  });
};