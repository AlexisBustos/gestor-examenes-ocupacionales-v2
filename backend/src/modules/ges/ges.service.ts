import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HERRAMIENTAS DE LIMPIEZA ---
const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

// --- DICCIONARIO MAESTRO (ESPECÍFICO -> GENERAL) ---
const KEYWORD_MAP: Record<string, string> = {
  // FÍSICOS
  'ruido': 'RUIDO',
  'prexor': 'RUIDO',
  'sordera': 'RUIDO',
  'vibracion': 'VIBRACIONES', // Cubre "Vibración" y "Vibraciones"
  
  // RADIACIÓN
  'uv': 'UV',
  'solar': 'UV', 
  'radiacion': 'RADIACIÓN',
  'ionizante': 'RADIACIÓN',

  // METALES ESPECÍFICOS (Prioridad Alta)
  'manganeso': 'MANGANESO', // Busca "Protocolo ... MANGANESO"
  'plomo': 'PLOMO',
  'arsenico': 'ARSÉNICO',
  'cromo': 'CROMO',
  'mercurio': 'METALES', 
  
  // METALES GENERALES
  'hierro': 'HUMOS',        // Hierro -> Humos Metálicos
  'soldad': 'HUMOS',
  'humo': 'HUMOS',
  'metal': 'METALES',       // Fallback si no encuentra específico

  // QUÍMICOS ESPECÍFICOS
  'tolueno': 'TOLUENO',
  'xileno': 'XILENO',
  'hexano': 'HEXANO',
  'metiletilcetona': 'SOLVENTES', // O crear batería específica si existe
  
  // QUÍMICOS GENERALES
  'solvente': 'SOLVENTES',

  // OTROS
  'calor': 'ESTRÉS',
  'frio': 'ESTRÉS',
  'termico': 'ESTRÉS',
  'estres': 'ESTRÉS',
  'silice': 'SÍLICE',
  'polvo': 'SÍLICE',
  'neumo': 'SÍLICE',
  'plaguicida': 'PLAGUICIDAS',
  'altura': 'ALTURA', // Cubre Física y Geográfica si el nombre coincide
  'geografica': 'GEOGRÁFICA',
  'fisica': 'FÍSICA'
};

// --- CONSULTAS ---
export const getAllGes = async (areaId?: string) => {
  const where = areaId ? { areaId } : {};
  return await prisma.ges.findMany({
    where,
    include: { riskExposures: { include: { riskAgent: true } }, technicalReport: true },
  });
};

export const getGesById = async (id: string) => {
  return await prisma.ges.findUnique({
    where: { id },
    include: {
      riskExposures: { include: { riskAgent: true } },
      technicalReport: true,
      area: { include: { workCenter: true } }
    },
  });
};

export const createGes = async (data: any) => { return await prisma.ges.create({ data }); };

// --- LÓGICA DE SUGERENCIA (Con Logs para verificar) ---
const findBatteriesForRisks = async (riskExposures: any[]) => {
  const allBatteries = await prisma.examBattery.findMany();
  let suggestions: any[] = [];

  console.log(`🔎 Analizando ${riskExposures.length} riesgos...`);

  for (const riskExp of riskExposures) {
    const riskNameClean = normalizeText(riskExp.riskAgent.name);
    const detailClean = normalizeText(riskExp.specificAgentDetails || '');
    const fullText = `${riskNameClean} ${detailClean}`; // Ej: "metales manganeso"
    
    let matched = false;

    // 1. Búsqueda por Mapa
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      if (fullText.includes(trigger)) { // Si el riesgo dice "manganeso"
        const targetClean = normalizeText(target);
        // Busca batería que diga "MANGANESO"
        const bat = allBatteries.find(b => normalizeText(b.name).includes(targetClean));
        if (bat) { 
            suggestions.push(bat); 
            matched = true; 
            console.log(`   ✅ Match: "${trigger}" -> "${bat.name}"`);
        }
      }
    }
    
    // 2. Fallback Directo
    if (!matched) {
       const bat = allBatteries.find(b => normalizeText(b.name).includes(riskNameClean));
       if (bat) suggestions.push(bat);
    }
  }
  
  // Eliminar duplicados
  return [...new Map(suggestions.map(item => [item['id'], item])).values()];
};

// 1. SUGERIR POR GES
export const getSuggestedBatteries = async (gesId: string) => {
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });
  if (!ges || !ges.riskExposures) return [];
  return findBatteriesForRisks(ges.riskExposures);
};

// 2. SUGERIR POR ÁREA
export const getBatteriesByArea = async (areaId: string) => {
  const gesList = await prisma.ges.findMany({
    where: { areaId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });
  const allRisks = gesList.flatMap(g => g.riskExposures);
  return findBatteriesForRisks(allRisks);
};

// Subida reporte (sin cambios)
export const uploadGesReport = async (gesId: string, fileData: any, meta: any) => {
  const ges = await prisma.ges.findUnique({ where: { id: gesId }, include: { area: { include: { workCenter: true } } } });
  if (!ges) throw new Error("GES no encontrado");

  const report = await prisma.technicalReport.create({
    data: {
      pdfUrl: `/uploads/${fileData.filename}`,
      reportNumber: meta.reportNumber,
      reportDate: new Date(meta.reportDate),
      companyId: ges.area.workCenter.companyId,
      gesGroups: { connect: { id: gesId } }
    }
  });
  
  // Lógica de vigencia y replicación...
  const nextDate = new Date(meta.reportDate);
  nextDate.setFullYear(nextDate.getFullYear() + 3);

  if (meta.applyToArea) {
    await prisma.ges.updateMany({ where: { areaId: ges.areaId }, data: { nextEvaluationDate: nextDate, technicalReportId: report.id } });
    const siblings = await prisma.ges.findMany({ where: { areaId: ges.areaId }, select: { id: true } });
    await prisma.technicalReport.update({ where: { id: report.id }, data: { gesGroups: { connect: siblings } } });
  } else {
    await prisma.ges.update({ where: { id: gesId }, data: { nextEvaluationDate: nextDate, technicalReportId: report.id } });
  }
  return report;
};