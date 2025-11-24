import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CEREBRO INTELIGENTE (Mismo mapa que en Orders) ---
const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const KEYWORD_MAP: Record<string, string> = {
  'calor': 'estres', 'termico': 'estres', 'frio': 'estres',
  'ruido': 'ruido', 'prexor': 'ruido',
  'silice': 'silice', 'polvo': 'silice', 'neumo': 'silice',
  'plaguicida': 'plaguicida',
  'solvente': 'solvente', 'quimico': 'solvente', 'vapor': 'solvente',
  'metal': 'metal', 'humo': 'metal', 'soldad': 'metal',
  'manganeso': 'manganeso', 'cromo': 'cromo', 'plomo': 'plomo', 'arsenico': 'arsenico',
  'vibracion': 'vibracion',
  'altura': 'altura', 'geografica': 'geografica', 'fisica': 'fisica',
  'ionizante': 'radiacion', 'uv': 'uv'
};

export const getAllGes = async () => {
  return await prisma.ges.findMany({
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

// --- NUEVA FUNCIÓN PÚBLICA: PREDECIR BATERÍAS ---
export const getSuggestedBatteries = async (gesId: string) => {
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });

  if (!ges || !ges.riskExposures) return [];

  const allBatteries = await prisma.examBattery.findMany();
  let suggestions: any[] = [];

  for (const riskExp of ges.riskExposures) {
    const riskNameClean = normalizeText(riskExp.riskAgent.name);
    const detailClean = normalizeText(riskExp.specificAgentDetails || '');
    const fullRisk = `${riskNameClean} ${detailClean}`;
    
    let matched = false;

    // 1. Mapa
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      if (fullRisk.includes(trigger)) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
        if (bat) {
          suggestions.push(bat);
          matched = true;
        }
      }
    }
    // 2. Directo
    if (!matched) {
       const bat = allBatteries.find(b => normalizeText(b.name).includes(riskNameClean));
       if (bat) suggestions.push(bat);
    }
  }
  
  // Eliminar duplicados
  return [...new Map(suggestions.map(item => [item['id'], item])).values()];
};

// ... (Mantener uploadGesReport igual que antes) ...
export const uploadGesReport = async (gesId: string, fileData: any, meta: any) => {
  // (Copia la función uploadGesReport que ya tenías funcionando para los PDF)
  // Si la borraste, avísame y te la paso, pero este archivo debe tener ambas.
  // ... AQUI VA LA LOGICA DE PDF QUE HICIMOS ANTES ...
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