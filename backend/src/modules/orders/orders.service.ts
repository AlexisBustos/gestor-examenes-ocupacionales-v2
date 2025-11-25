import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. HERRAMIENTAS DE INTELIGENCIA MÉDICA ---
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Mapa de Sinónimos (Para detectar baterías automáticamente)
const KEYWORD_MAP: Record<string, string> = {
  'calor': 'ESTRÉS',
  'termico': 'ESTRÉS',
  'frio': 'ESTRÉS',
  'estres': 'ESTRÉS',
  'ruido': 'RUIDO',
  'prexor': 'RUIDO',
  'sordera': 'RUIDO',
  'silice': 'SÍLICE',
  'polvo': 'SÍLICE',
  'neumo': 'SÍLICE',
  'plaguicida': 'PLAGUICIDAS',
  'citostatico': 'CITOSTÁTICOS',
  'manganeso': 'MANGANESO',
  'plomo': 'PLOMO',
  'arsenico': 'ARSÉNICO',
  'cromo': 'CROMO',
  'mercurio': 'MERCURIO',
  'metal': 'METALES',
  'humo': 'HUMOS',
  'soldad': 'HUMOS',
  'vibracion': 'VIBRACIONES',
  'altura': 'ALTURA',
  'geografica': 'GEOGRÁFICA',
  'fisica': 'FÍSICA',
  'radiacion': 'RADIACIONES',
  'ionizante': 'RADIACIONES',
  'uv': 'UV',
  'asma': 'ASMA',
  'solvente': 'SOLVENTES',
  'tolueno': 'TOLUENO',
  'xileno': 'XILENO',
  'hexano': 'HEXANO',
  'metiletilcetona': 'METILETILCETONA'
};

// --- 2. FUNCIONES DEL SERVICIO ---

// Obtener todas las órdenes (Para la tabla)
export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status ? { status: status as any } : {};
  
  return await prisma.examOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: true,
      company: true,
      examBatteries: true,
      ges: {
        include: {
          riskExposures: { include: { riskAgent: true } },
          technicalReport: true
        }
      },
    },
  });
};

// Crear Orden (Con Inteligencia)
export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  examBatteryId?: string;
  evaluationType: string;
}) => {
  
  // A. Upsert Trabajador
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

  // B. Buscador de Baterías
  const ges = await prisma.ges.findUnique({
    where: { id: data.gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });

  let batteriesToConnect: { id: string }[] = [];

  if (ges && ges.riskExposures) {
    const allBatteries = await prisma.examBattery.findMany();

    for (const riskExp of ges.riskExposures) {
        const riskNameClean = normalizeText(riskExp.riskAgent.name); 
        const detailClean = normalizeText(riskExp.specificAgentDetails || '');
        const fullText = `${riskNameClean} ${detailClean}`;

        let foundMatch = false;

        // Estrategia 1: Mapa
        for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
            const targetClean = normalizeText(target);
            if (fullText.includes(trigger)) {
                const bat = allBatteries.find(b => normalizeText(b.name).includes(targetClean));
                if (bat) {
                    batteriesToConnect.push({ id: bat.id });
                    foundMatch = true;
                }
            }
        }

        // Estrategia 2: Directa
        if (!foundMatch) {
            const bat = allBatteries.find(b => normalizeText(b.name).includes(riskNameClean));
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
      examBatteries: { connect: batteriesToConnect }
    },
  });
};

// Actualizar Estado (AQUÍ ESTÁ LA CLAVE PARA CANCELAR)
export const updateOrderStatus = async (
  id: string, 
  status: string, 
  scheduledAt?: string, 
  providerName?: string, 
  externalId?: string
) => {
  return await prisma.examOrder.update({
    where: { id },
    data: {
      status: status as any,
      // Solo actualizamos la fecha si viene definida (para agendar). 
      // Si es anular, esto viene undefined y no toca lo que ya había.
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      providerName,
      externalId
    },
  });
};