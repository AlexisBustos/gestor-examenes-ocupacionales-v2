import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const KEYWORD_MAP: Record<string, string> = {
  'calor': 'ESTRÉS', 'termico': 'ESTRÉS', 'frio': 'ESTRÉS', 'estres': 'ESTRÉS',
  'ruido': 'RUIDO', 'prexor': 'RUIDO',
  'silice': 'SÍLICE', 'polvo': 'SÍLICE', 'neumo': 'SÍLICE',
  'solvente': 'SOLVENTES', 'tolueno': 'TOLUENO', 'xileno': 'XILENO', 'hexano': 'HEXANO',
  'metal': 'METALES', 'humo': 'HUMOS', 'soldad': 'HUMOS', 'manganeso': 'MANGANESO',
  'plomo': 'PLOMO', 'arsenico': 'ARSÉNICO', 'cromo': 'CROMO',
  'vibracion': 'VIBRACIONES', 'altura': 'ALTURA'
};

// OBTENER (Con resultados detallados)
export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status ? { status: status as any } : {};
  return await prisma.examOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: true, company: true, ges: true,
      // Incluir la tabla intermedia con estado y fechas
      orderBatteries: { include: { battery: true } }
    },
  });
};

// CREAR (Poblando OrderBattery)
export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  examBatteryId?: string;
  evaluationType: string;
}) => {
  
  const worker = await prisma.worker.upsert({
    where: { rut: data.worker.rut },
    update: { name: data.worker.name, currentGesId: data.gesId },
    create: { rut: data.worker.rut, name: data.worker.name, companyId: data.companyId, currentGesId: data.gesId }
  });

  const ges = await prisma.ges.findUnique({
    where: { id: data.gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });

  let batteriesToConnect: { id: string }[] = [];

  if (ges && ges.riskExposures) {
    const allBatteries = await prisma.examBattery.findMany();
    for (const riskExp of ges.riskExposures) {
        const fullText = `${normalizeText(riskExp.riskAgent.name)} ${normalizeText(riskExp.specificAgentDetails || '')}`;
        let foundMatch = false;
        for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
            if (fullText.includes(trigger)) {
                const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
                if (bat) { batteriesToConnect.push({ id: bat.id }); foundMatch = true; }
            }
        }
        if (!foundMatch) {
            const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(riskExp.riskAgent.name)));
            if (bat) batteriesToConnect.push({ id: bat.id });
        }
    }
  }

  const uniqueIds = new Set(batteriesToConnect.map(b => b.id));
  batteriesToConnect = Array.from(uniqueIds).map(id => ({ id }));

  if (batteriesToConnect.length === 0) {
      const fallback = await prisma.examBattery.findFirst();
      if (fallback) batteriesToConnect.push({ id: fallback.id });
  }

  return await prisma.examOrder.create({
    data: {
      status: 'SOLICITADO',
      workerId: worker.id, companyId: data.companyId, gesId: data.gesId,
      // Crear registros en tabla intermedia
      orderBatteries: {
          create: batteriesToConnect.map(b => ({
              batteryId: b.id,
              status: 'PENDIENTE'
          }))
      }
    },
  });
};

// ACTUALIZAR ESTADO GENERAL
export const updateOrderStatus = async (id: string, status: string, scheduledAt?: string, providerName?: string, externalId?: string) => {
  return await prisma.examOrder.update({
    where: { id },
    data: { status: status as any, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, providerName, externalId },
  });
};

// ACTUALIZAR RESULTADO DE BATERÍA INDIVIDUAL
export const updateBatteryResult = async (orderBatteryId: string, status: string, expirationDate?: string) => {
  return await prisma.orderBattery.update({
    where: { id: orderBatteryId },
    data: {
        status: status as any,
        expirationDate: expirationDate ? new Date(expirationDate) : null
    }
  });
};