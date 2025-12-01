import { PrismaClient, Prisma } from '@prisma/client';
import { getSuggestedBatteries } from '../ges/ges.service'; // Reutilizamos la inteligencia del GES

const prisma = new PrismaClient();

// --- HERRAMIENTAS DE INTELIGENCIA (LEGACY PARA CREACIÓN SIN HISTORIAL) ---
const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const KEYWORD_MAP: Record<string, string> = {
  'calor': 'ESTRÉS', 'termico': 'ESTRÉS', 'frio': 'ESTRÉS', 'estres': 'ESTRÉS',
  'ruido': 'RUIDO', 'prexor': 'RUIDO', 'sordera': 'RUIDO',
  'silice': 'SÍLICE', 'polvo': 'SÍLICE', 'neumo': 'SÍLICE', 'cristalizada': 'SÍLICE',
  'plaguicida': 'PLAGUICIDAS', 'citostatico': 'CITOSTÁTICOS',
  'solvente': 'SOLVENTES', 'tolueno': 'TOLUENO', 'xileno': 'XILENO', 'hexano': 'HEXANO', 'metiletilcetona': 'METILETILCETONA',
  'metal': 'METALES', 'humo': 'HUMOS', 'soldad': 'HUMOS', 'manganeso': 'MANGANESO',
  'plomo': 'PLOMO', 'arsenico': 'ARSÉNICO', 'cromo': 'CROMO', 'mercurio': 'MERCURIO',
  'vibracion': 'VIBRACIONES', 'altura': 'ALTURA', 'geografica': 'GEOGRÁFICA', 'fisica': 'FÍSICA',
  'radiacion': 'RADIACIONES', 'ionizante': 'RADIACIONES', 'uv': 'UV', 'asma': 'ASMA'
};

// --- 1. OBTENER ÓRDENES ---
export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status ? { status: status as any } : {};
  
  return await prisma.examOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: true,
      company: true,
      ges: {
        include: {
          riskExposures: { include: { riskAgent: true } },
          technicalReport: true
        }
      },
      orderBatteries: { include: { battery: true } }
    },
  });
};

// --- 2. SUGERENCIAS INTELIGENTES (NUEVO) ---
export const getWorkerOrderSuggestions = async (workerId: string | undefined, gesId: string) => {
  // A. Obtenemos lo que el GES requiere (Manual o Automático)
  const requiredBatteries = await getSuggestedBatteries(gesId);

  // Si no hay trabajador (es nuevo) o no viene ID, todo es faltante
  if (!workerId) {
      return {
          required: requiredBatteries,
          covered: [],
          missing: requiredBatteries
      };
  }

  // B. Obtenemos el historial VIGENTE del trabajador
  const workerHistory = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
          examOrders: {
              include: {
                  orderBatteries: {
                      where: {
                          status: 'APTO', // Solo exámenes aprobados
                          // Validación de fecha: Solo si vence en el futuro
                          expirationDate: { gt: new Date() } 
                      },
                      include: { battery: true }
                  }
              }
          }
      }
  });

  const coveredIds = new Set<string>();
  if (workerHistory) {
      workerHistory.examOrders.forEach(order => {
          order.orderBatteries.forEach(ob => coveredIds.add(ob.batteryId));
      });
  }

  // C. Calculamos Delta
  const covered = requiredBatteries.filter(b => coveredIds.has(b.id));
  const missing = requiredBatteries.filter(b => !coveredIds.has(b.id));

  return {
      required: requiredBatteries,
      covered,
      missing
  };
};

// --- 3. CREAR ORDEN ---
export const createOrder = async (data: {
  worker: { rut: string; name: string; phone?: string; position?: string };
  gesId: string;
  companyId: string;
  evaluationType: string;
  examBatteries?: { id: string }[]; 
}) => {
  
  const worker = await prisma.worker.upsert({
    where: { rut: data.worker.rut },
    update: { name: data.worker.name, phone: data.worker.phone, position: data.worker.position, currentGesId: data.gesId },
    create: { rut: data.worker.rut, name: data.worker.name, phone: data.worker.phone, position: data.worker.position || 'Sin Cargo', companyId: data.companyId, currentGesId: data.gesId }
  });

  let batteriesToConnect: { id: string }[] = [];

  if (data.examBatteries && data.examBatteries.length > 0) {
      batteriesToConnect = data.examBatteries;
  } else {
      // Fallback: Si el frontend no mandó baterías explícitas (caso legacy), calculamos las básicas
      // OJO: Aquí idealmente deberíamos usar getSuggestedBatteries, pero mantenemos
      // la lógica de keywords interna para no romper seeds antiguos si algo falla.
      // En el flujo nuevo, el frontend SIEMPRE enviará 'examBatteries' desde 'missing'.
      
      // ... (Lógica legacy de keywords mantenida por seguridad) ...
      const ges = await prisma.ges.findUnique({
        where: { id: data.gesId },
        include: { riskExposures: { include: { riskAgent: true } } }
      });

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