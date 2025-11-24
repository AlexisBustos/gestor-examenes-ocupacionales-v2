import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// MAPA DE PRECISIÓN: (Palabra en el Excel -> Palabra en la Batería)
const KEYWORD_MAP: Record<string, string> = {
  'manganeso': 'MANGANESO',
  'hierro': 'HUMOS', // Hierro va a la genérica de humos
  'plomo': 'PLOMO',
  'cromo': 'CROMO',
  'arsenico': 'ARSÉNICO',
  'mercurio': 'METALES', // O específica si la creas
  'tolueno': 'TOLUENO',
  'xileno': 'XILENO',
  'hexano': 'HEXANO',
  'metiletilcetona': 'SOLVENTES', // Fallback a general
  'ruido': 'RUIDO',
  'silice': 'SÍLICE',
  'calor': 'ESTRÉS',
  'termico': 'ESTRÉS',
  'vibracion': 'VIBRACIONES'
};

export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status ? { status: status as any } : {};
  return await prisma.examOrder.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: {
      worker: true, company: true, examBatteries: true,
      ges: { include: { riskExposures: { include: { riskAgent: true } }, technicalReport: true } }
    },
  });
};

export const createOrder = async (data: any) => {
  // 1. Worker Upsert
  const worker = await prisma.worker.upsert({
    where: { rut: data.worker.rut },
    update: { name: data.worker.name, currentGesId: data.gesId, position: data.worker.position },
    create: { rut: data.worker.rut, name: data.worker.name, position: data.worker.position || 'Sin Cargo', companyId: data.companyId, currentGesId: data.gesId },
  });

  // 2. MATCHING DE BATERÍAS
  const ges = await prisma.ges.findUnique({
    where: { id: data.gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });

  let batteriesToConnect: { id: string }[] = [];

  if (ges && ges.riskExposures) {
    const allBatteries = await prisma.examBattery.findMany();

    for (const riskExp of ges.riskExposures) {
        // Analizamos TODO: El nombre del riesgo y el detalle específico
        const riskName = normalizeText(riskExp.riskAgent.name);
        const specificDetail = normalizeText(riskExp.specificAgentDetails || '');
        const combinedText = `${riskName} ${specificDetail}`; // "metales manganeso"

        console.log(`🔍 Analizando: "${combinedText}"`);
        let found = false;

        // A. Búsqueda por Mapa (Prioridad Alta)
        for (const [key, target] of Object.entries(KEYWORD_MAP)) {
            if (combinedText.includes(key)) {
                // Si encuentro "manganeso", busco batería con "MANGANESO"
                const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
                if (bat) {
                    batteriesToConnect.push({ id: bat.id });
                    console.log(`   ✅ Match: ${bat.name}`);
                    found = true;
                }
            }
        }

        // B. Búsqueda Directa (Fallback)
        if (!found) {
            const bat = allBatteries.find(b => normalizeText(b.name).includes(riskName));
            if (bat) batteriesToConnect.push({ id: bat.id });
        }
    }
  }

  // Eliminar duplicados
  const uniqueIds = new Set(batteriesToConnect.map(b => b.id));
  batteriesToConnect = Array.from(uniqueIds).map(id => ({ id }));

  // Fallback final
  if (batteriesToConnect.length === 0) {
      const fb = await prisma.examBattery.findFirst();
      if (fb) batteriesToConnect.push({ id: fb.id });
  }

  return await prisma.examOrder.create({
    data: {
      status: 'SOLICITADO',
      workerId: worker.id, companyId: data.companyId, gesId: data.gesId,
      examBatteries: { connect: batteriesToConnect }
    },
  });
};

export const updateOrderStatus = async (id: string, status: string, scheduledAt?: string, providerName?: string, externalId?: string) => {
  return await prisma.examOrder.update({
    where: { id },
    data: { status: status as any, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, providerName, externalId },
  });
};