import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HERRAMIENTAS DE INTELIGENCIA ---
const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const KEYWORD_MAP: Record<string, string> = {
  'calor': 'ESTRÉS', 'termico': 'ESTRÉS', 'frio': 'ESTRÉS', 'estres': 'ESTRÉS',
  'ruido': 'RUIDO', 'prexor': 'RUIDO', 'sordera': 'RUIDO',
  'silice': 'SÍLICE', 'polvo': 'SÍLICE', 'neumo': 'SÍLICE',
  'solvente': 'SOLVENTES', 'tolueno': 'TOLUENO', 'xileno': 'XILENO', 'hexano': 'HEXANO', 'metiletilcetona': 'METILETILCETONA',
  'plaguicida': 'PLAGUICIDAS', 'citostatico': 'CITOSTÁTICOS',
  'manganeso': 'MANGANESO', 'plomo': 'PLOMO', 'arsenico': 'ARSÉNICO', 'cromo': 'CROMO',
  'metal': 'METALES', 'humo': 'HUMOS', 'soldad': 'HUMOS',
  'geografica': 'GEOGRÁFICA', 'fisica': 'FÍSICA', 'altura': 'ALTURA',
  'radiacion': 'RADIACIONES', 'ionizante': 'RADIACIONES', 'uv': 'UV', 'asma': 'ASMA',
  'vibracion': 'VIBRACIONES'
};

// --- CONSULTAS (AQUÍ ESTABA EL PROBLEMA DE VISUALIZACIÓN) ---

export const getAllGes = async (areaId?: string) => {
  const where = areaId ? { areaId } : {};
  return await prisma.ges.findMany({
    where,
    include: { 
      riskExposures: { include: { riskAgent: true } }, 
      technicalReport: { // Traemos el reporte
        include: {
           prescriptions: true, // Traemos las prescripciones del cualitativo
           quantitativeReports: { // Traemos los cuantitativos
             include: {
               prescriptions: true // Traemos las prescripciones de los cuantitativos
             }
           }
        }
      }
    },
  });
};

export const getGesById = async (id: string) => {
  return await prisma.ges.findUnique({
    where: { id },
    include: {
      riskExposures: { include: { riskAgent: true } },
      technicalReport: {
        include: {
           // 👇 ESTO ES LO QUE FALTABA PARA QUE SE VEAN LOS DATOS
           prescriptions: { orderBy: { createdAt: 'desc' } },
           quantitativeReports: {
             include: {
               prescriptions: { orderBy: { createdAt: 'desc' } }
             },
             orderBy: { reportDate: 'desc' }
           }
        }
      },
      area: { include: { workCenter: true } }
    },
  });
};

export const createGes = async (data: any) => { return await prisma.ges.create({ data }); };

// --- SUGERENCIAS ---
const findBatteriesForRisks = async (riskExposures: any[]) => {
  const allBatteries = await prisma.examBattery.findMany();
  let suggestions: any[] = [];

  for (const riskExp of riskExposures) {
    const riskNameClean = normalizeText(riskExp.riskAgent.name);
    const detailClean = normalizeText(riskExp.specificAgentDetails || '');
    const fullText = `${riskNameClean} ${detailClean}`;
    
    let matched = false;
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      if (fullText.includes(trigger)) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
        if (bat) { suggestions.push(bat); matched = true; }
      }
    }
    if (!matched) {
       const bat = allBatteries.find(b => normalizeText(b.name).includes(riskNameClean));
       if (bat) suggestions.push(bat);
    }
  }
  return [...new Map(suggestions.map(item => [item['id'], item])).values()];
};

export const getSuggestedBatteries = async (gesId: string) => {
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });
  if (!ges || !ges.riskExposures) return [];
  return findBatteriesForRisks(ges.riskExposures);
};

export const getBatteriesByArea = async (areaId: string) => {
  const gesList = await prisma.ges.findMany({
    where: { areaId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });
  const allRisks = gesList.flatMap(g => g.riskExposures);
  return findBatteriesForRisks(allRisks);
};

// --- SUBIDA REPORTE ---
export const uploadGesReport = async (gesId: string, fileData: any, meta: any) => {
  const ges = await prisma.ges.findUnique({ where: { id: gesId }, include: { area: { include: { workCenter: true } } } });
  if (!ges) throw new Error("GES no encontrado");

  // Verificar si ya existe un reporte para actualizarlo en lugar de crear otro
  // (Opcional, pero recomendado para mantener historial limpio en este modelo simple)
  // Por ahora creamos uno nuevo y actualizamos la referencia.

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