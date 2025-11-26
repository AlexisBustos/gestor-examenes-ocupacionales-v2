import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const KEYWORD_MAP: Record<string, string> = {
  'tolueno': 'TOLUENO',
  'xileno': 'XILENO',
  'hexano': 'HEXANO',
  'metiletilcetona': 'METILETILCETONA',
  'manganeso': 'MANGANESO',
  'plomo': 'PLOMO',
  'arsenico': 'ARSÉNICO',
  'cromo': 'CROMO',
  'mercurio': 'MERCURIO',
  'ruido': 'RUIDO',
  'prexor': 'RUIDO',
  'silice': 'SÍLICE',
  'polvo': 'SÍLICE',
  'neumo': 'SÍLICE',
  'plaguicida': 'PLAGUICIDAS',
  'citostatico': 'CITOSTÁTICOS',
  'radiacion': 'RADIACIONES',
  'ionizante': 'RADIACIONES',
  'asma': 'ASMA',
  'vibracion': 'VIBRACIONES',
  'solvente': 'SOLVENTES',
  'metal': 'METALES',
  'humo': 'HUMOS',
  'soldad': 'HUMOS',
  'calor': 'ESTRÉS',
  'frio': 'ESTRÉS',
  'estres': 'ESTRÉS',
  'termico': 'ESTRÉS',
  'geografica': 'GEOGRÁFICA',
  'fisica': 'FÍSICA',
  'altura': 'ALTURA'
};

export const getAllGes = async () => {
  return await prisma.ges.findMany({
    include: {
      riskExposures: { include: { riskAgent: true } },
      technicalReport: {
        include: {
          prescriptions: true,
          quantitativeReports: { include: { prescriptions: true } }
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
          prescriptions: true,
          quantitativeReports: { include: { prescriptions: true } }
        }
      },
      area: { include: { workCenter: true } }
    },
  });
};

export const createGes = async (data: any) => { return await prisma.ges.create({ data }); };

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
    const textToAnalyze = `${riskNameClean} ${detailClean}`;

    let foundMatch = false;

    // 1. Mapa
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      const targetClean = normalizeText(target);
      if (textToAnalyze.includes(trigger)) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(targetClean));
        if (bat) {
          suggestions.push(bat);
          foundMatch = true;
        }
      }
    }
    // 2. Directo
    if (!foundMatch) {
      const bat = allBatteries.find(b => normalizeText(b.name).includes(riskNameClean));
      if (bat) suggestions.push(bat);
    }
  }

  return [...new Map(suggestions.map(item => [item['id'], item])).values()];
};

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