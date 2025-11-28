import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HERRAMIENTA DE LIMPIEZA ÚNICA ---
const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

// --- CONSULTAS BÁSICAS ---
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
      technicalReport: {
        include: {
           prescriptions: { orderBy: { createdAt: 'desc' } },
           quantitativeReports: {
             include: { prescriptions: { orderBy: { createdAt: 'desc' } } },
             orderBy: { reportDate: 'desc' }
           }
        }
      },
      area: { include: { workCenter: true } }
    },
  });
};

export const createGes = async (data: any) => { return await prisma.ges.create({ data }); };

// --- CEREBRO DE SUGERENCIAS (CONECTADO A BASE DE DATOS) ---
const findBatteriesForRisks = async (riskExposures: any[]) => {
  let suggestions: any[] = [];
  
  // Traemos TODAS las reglas de la base de datos (están en memoria para ser rápido)
  const rules = await prisma.medicalRule.findMany({ include: { battery: true } });

  for (const riskExp of riskExposures) {
    const riskName = normalizeText(riskExp.riskAgent.name);
    const detail = normalizeText(riskExp.specificAgentDetails || '');
    
    // Buscamos coincidencia en las reglas
    for (const rule of rules) {
        const ruleAgent = normalizeText(rule.riskAgentName);
        const ruleDetail = normalizeText(rule.specificDetail || '');

        // 1. Coincidencia Exacta (Agente + Detalle)
        if (ruleDetail && riskName.includes(ruleAgent) && detail.includes(ruleDetail)) {
            suggestions.push(rule.battery);
        }
        // 2. Coincidencia General (Solo Agente, si la regla no pide detalle)
        else if (!ruleDetail && riskName.includes(ruleAgent)) {
            suggestions.push(rule.battery);
        }
    }
  }

  return [...new Map(suggestions.map(item => [item['id'], item])).values()];
};

// 1. SUGERIR POR GES (INDIVIDUAL)
export const getSuggestedBatteries = async (gesId: string) => {
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: { riskExposures: { include: { riskAgent: true } } }
  });
  if (!ges || !ges.riskExposures) return [];
  return findBatteriesForRisks(ges.riskExposures);
};

// 2. SUGERIR POR ÁREA (AGREGADO)
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