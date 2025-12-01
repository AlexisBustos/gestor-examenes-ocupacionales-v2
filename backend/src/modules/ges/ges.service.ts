import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- DICCIONARIO LEGACY (Respaldo Automático) ---
const normalizeText = (text: string) => {
  return text
    ? text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    : '';
};

const KEYWORD_MAP: Record<string, string> = {
  ruido: 'RUIDO',
  prexor: 'RUIDO',
  silice: 'SÍLICE',
  polvo: 'SÍLICE',
  solvente: 'SOLVENTES',
  tolueno: 'TOLUENO',
  xileno: 'XILENO',
  metal: 'METALES',
  humo: 'HUMOS',
  manganeso: 'MANGANESO',
  plomo: 'PLOMO',
  calor: 'ESTRÉS',
  termico: 'ESTRÉS',
  altura: 'ALTURA',
  vibracion: 'VIBRACIONES',
  uv: 'UV',
  solar: 'UV',
};

const findBatteriesByKeywords = async (riskExposures: any[]) => {
  const allBatteries = await prisma.examBattery.findMany();
  let suggestions: any[] = [];

  for (const riskExp of riskExposures) {
    const fullText = `${normalizeText(riskExp.riskAgent.name)} ${normalizeText(
      riskExp.specificAgentDetails,
    )}`;
    let matched = false;

    // 1. Búsqueda por mapa de palabras clave
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      if (fullText.includes(trigger)) {
        const bat = allBatteries.find((b) =>
          normalizeText(b.name).includes(normalizeText(target)),
        );
        if (bat) {
          suggestions.push(bat);
          matched = true;
        }
      }
    }

    // 2. Búsqueda directa por nombre de agente (fallback)
    if (!matched) {
      const bat = allBatteries.find((b) =>
        normalizeText(b.name).includes(
          normalizeText(riskExp.riskAgent.name),
        ),
      );
      if (bat) suggestions.push(bat);
    }
  }

  // Eliminar duplicados
  const uniqueMap = new Map(suggestions.map((i) => [i.id, i]));
  return Array.from(uniqueMap.values());
};

// --- SERVICIOS CRUD BÁSICOS ---

export const getAllGes = async (areaId?: string) => {
  const where = areaId ? { areaId } : {};
  return await prisma.ges.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      riskExposures: { include: { riskAgent: true } },
      examBatteries: true, // Reglas manuales
    },
  });
};

export const getGesById = async (id: string) => {
  return await prisma.ges.findUnique({
    where: { id },
    include: {
      riskExposures: { include: { riskAgent: true } },
      examBatteries: true,
      area: { include: { workCenter: true } },
    },
  });
};

export const createGes = async (data: any) => {
  return await prisma.ges.create({ data });
};

// --- GESTIÓN DE REGLAS (MANUAL) ---

export const updateGesBatteries = async (
  gesId: string,
  batteryIds: string[],
) => {
  // Reemplaza todas las asociaciones existentes con las nuevas
  return await prisma.ges.update({
    where: { id: gesId },
    data: {
      examBatteries: {
        set: batteryIds.map((id) => ({ id })),
      },
    },
    include: { examBatteries: true },
  });
};

// --- LÓGICA HÍBRIDA DE SUGERENCIAS (COMPATIBLE CON WORKERS) ---

export const getSuggestedBatteries = async (gesId: string) => {
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: {
      examBatteries: true, // 1. Buscar asignación manual
      riskExposures: { include: { riskAgent: true } },
    },
  });

  if (!ges) return [];

  // PRIORIDAD 1: Si hay baterías manuales en el GES, usar esas.
  if (ges.examBatteries && ges.examBatteries.length > 0) {
    return ges.examBatteries;
  }

  // PRIORIDAD 2: Si no hay manuales, usar algoritmo automático (legacy)
  if (ges.riskExposures && ges.riskExposures.length > 0) {
    return findBatteriesByKeywords(ges.riskExposures);
  }

  return [];
};

// Lógica por Área (Agregación)
export const getBatteriesByArea = async (areaId: string) => {
  const gesList = await prisma.ges.findMany({
    where: { areaId },
    include: {
      examBatteries: true,
      riskExposures: { include: { riskAgent: true } },
    },
  });

  let allBatteries: any[] = [];

  for (const ges of gesList) {
    if (ges.examBatteries.length > 0) {
      allBatteries.push(...ges.examBatteries);
    } else {
      const auto = await findBatteriesByKeywords(ges.riskExposures);
      allBatteries.push(...auto);
    }
  }

  // Eliminar duplicados
  const uniqueMap = new Map(allBatteries.map((i) => [i.id, i]));
  return Array.from(uniqueMap.values());
};
