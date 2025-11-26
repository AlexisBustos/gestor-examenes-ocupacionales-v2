import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. HERRAMIENTAS DE LIMPIEZA ---
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// --- 2. DICCIONARIO DE INTELIGENCIA ---
const KEYWORD_MAP: Record<string, string> = {
  'calor': 'ESTRÉS', 'termico': 'ESTRÉS', 'frio': 'ESTRÉS', 'estres': 'ESTRÉS',
  'tolueno': 'TOLUENO', 'xileno': 'XILENO', 'hexano': 'HEXANO', 'metiletilcetona': 'METILETILCETONA',
  'solvente': 'SOLVENTES', 'plaguicida': 'PLAGUICIDAS', 'citostatico': 'CITOSTÁTICOS',
  'silice': 'SÍLICE', 'polvo': 'SÍLICE', 'neumo': 'SÍLICE', 'cristalizada': 'SÍLICE',
  'ruido': 'RUIDO', 'prexor': 'RUIDO', 'sordera': 'RUIDO', 'vibracion': 'VIBRACIONES',
  'radiacion': 'RADIACIONES', 'ionizante': 'RADIACIONES', 'uv': 'UV',
  'manganeso': 'MANGANESO', 'plomo': 'PLOMO', 'arsenico': 'ARSÉNICO', 'cromo': 'CROMO', 'mercurio': 'MERCURIO',
  'metal': 'METALES', 'humo': 'HUMOS', 'soldad': 'HUMOS',
  'geografica': 'GEOGRÁFICA', 'fisica': 'FÍSICA', 'altura': 'ALTURA',
  'asma': 'ASMA'
};

// OBTENER ÓRDENES (Corrección Crítica Aquí)
export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status ? { status: status as any } : {};
  
  return await prisma.examOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: true,
      company: true,
      // 👇 ESTO ES LO QUE FALTABA O ESTABA MAL
      orderBatteries: {
        include: { battery: true } // Traer el nombre de la batería
      },
      ges: {
        include: {
          riskExposures: { include: { riskAgent: true } },
          technicalReport: true
        }
      },
    },
  });
};

// CREAR ORDEN
export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  examBatteryId?: string;
  evaluationType: string;
}) => {
  
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
      workerId: worker.id,
      companyId: data.companyId,
      gesId: data.gesId,
      // Creamos los registros en la tabla intermedia
      orderBatteries: {
          create: batteriesToConnect.map(b => ({
              batteryId: b.id,
              status: 'PENDIENTE'
          }))
      }
    },
  });
};

export const updateOrderStatus = async (id: string, status: string, scheduledAt?: string, providerName?: string, externalId?: string) => {
  return await prisma.examOrder.update({
    where: { id },
    data: { status: status as any, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, providerName, externalId },
  });
};

export const updateBatteryResult = async (orderBatteryId: string, status: string, expirationDate?: string) => {
    return await prisma.orderBattery.update({
      where: { id: orderBatteryId },
      data: {
          status: status as any,
          expirationDate: expirationDate ? new Date(expirationDate) : null
      }
    });
};