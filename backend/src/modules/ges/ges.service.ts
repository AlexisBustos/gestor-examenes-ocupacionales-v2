import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HELPERS ---
const normalizeText = (text: string) => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

// Mapa de respaldo por si no hay reglas manuales
const KEYWORD_MAP: Record<string, string> = {
  'ruido': 'RUIDO', 'prexor': 'RUIDO', 'silice': 'SÍLICE', 'polvo': 'SÍLICE',
  'solvente': 'SOLVENTES', 'tolueno': 'TOLUENO', 'xileno': 'XILENO',
  'metal': 'METALES', 'humo': 'HUMOS', 'manganeso': 'MANGANESO', 'plomo': 'PLOMO',
  'calor': 'ESTRÉS', 'termico': 'ESTRÉS', 'altura': 'ALTURA', 'vibracion': 'VIBRACIONES',
  'uv': 'UV', 'solar': 'UV'
};

const findBatteriesByKeywords = async (riskExposures: any[]) => {
  const allBatteries = await prisma.examBattery.findMany();
  let suggestions: any[] = [];

  for (const riskExp of riskExposures) {
    const fullText = `${normalizeText(riskExp.riskAgent.name)} ${normalizeText(riskExp.specificAgentDetails)}`;
    let matched = false;
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      if (fullText.includes(trigger)) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
        if (bat) { suggestions.push(bat); matched = true; }
      }
    }
    if (!matched) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(riskExp.riskAgent.name)));
        if (bat) suggestions.push(bat);
    }
  }
  const uniqueMap = new Map(suggestions.map(i => [i.id, i]));
  return Array.from(uniqueMap.values());
};

// --- CRUD BÁSICO ---
export const getAllGes = async (areaId?: string) => {
  const where = areaId ? { areaId } : {};
  return await prisma.ges.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { 
        riskExposures: { include: { riskAgent: true } }, 
        examBatteries: true,
        technicalReport: { select: { id: true, reportNumber: true } }
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
      technicalReport: { include: { prescriptions: true } }
    },
  });
};

export const createGes = async (data: any) => { return await prisma.ges.create({ data }); };

export const updateGesBatteries = async (gesId: string, batteryIds: string[]) => {
    return await prisma.ges.update({
        where: { id: gesId },
        data: { examBatteries: { set: batteryIds.map(id => ({ id })) } },
        include: { examBatteries: true }
    });
};

// --- SUGERENCIAS ---
export const getSuggestedBatteries = async (gesId: string) => {
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: { examBatteries: true, riskExposures: { include: { riskAgent: true } } }
  });
  if (!ges) return [];
  if (ges.examBatteries && ges.examBatteries.length > 0) return ges.examBatteries;
  if (ges.riskExposures) return findBatteriesByKeywords(ges.riskExposures);
  return [];
};

export const getBatteriesByArea = async (areaId: string) => {
    const gesList = await prisma.ges.findMany({
        where: { areaId },
        include: { examBatteries: true, riskExposures: { include: { riskAgent: true } } }
    });
    let allBatteries: any[] = [];
    for (const ges of gesList) {
        if (ges.examBatteries.length > 0) allBatteries.push(...ges.examBatteries);
        else {
            const auto = await findBatteriesByKeywords(ges.riskExposures);
            allBatteries.push(...auto);
        }
    }
    const uniqueMap = new Map(allBatteries.map(i => [i.id, i]));
    return Array.from(uniqueMap.values());
};

// --- GESTIÓN DOCUMENTAL (Funciones requeridas por el controlador) ---

export const getGesDocuments = async (gesId: string) => {
    const ges = await prisma.ges.findUnique({
        where: { id: gesId },
        include: { technicalReport: true }
    });

    if (!ges || !ges.technicalReport) return [];

    const quantitativeReports = await prisma.quantitativeReport.findMany({
        where: { technicalReportId: ges.technicalReport.id }
    });

    const docs = [
        {
            id: ges.technicalReport.id,
            name: `Informe Cualitativo ${ges.technicalReport.reportNumber}`,
            type: 'CUALITATIVO',
            reportDate: ges.technicalReport.reportDate,
            url: ges.technicalReport.pdfUrl,
            valid: true 
        },
        ...quantitativeReports.map(q => ({
            id: q.id,
            name: q.name,
            type: 'CUANTITATIVO',
            reportDate: q.reportDate,
            url: q.pdfUrl,
            valid: true
        }))
    ];

    return docs;
};

export const uploadGesDocument = async (gesId: string, file: any, meta: any) => {
    const ges = await prisma.ges.findUnique({ 
        where: { id: gesId }, 
        include: { area: { include: { workCenter: true } } } 
    });
    
    if (!ges) throw new Error("GES no encontrado");

    const fileUrl = `/uploads/${file.filename}`;
    const reportDate = new Date(meta.reportDate);

    if (meta.type === 'CUALITATIVO') {
        const report = await prisma.technicalReport.create({
            data: {
                reportNumber: meta.reportName || meta.reportNumber || 'S/N',
                reportDate: reportDate,
                pdfUrl: fileUrl,
                companyId: ges.area.workCenter.companyId,
                gesGroups: { connect: { id: gesId } }
            }
        });

        const nextDate = new Date(reportDate);
        nextDate.setFullYear(nextDate.getFullYear() + 3);

        if (meta.applyToArea === 'true') {
            await prisma.ges.updateMany({
                where: { areaId: ges.areaId },
                data: { technicalReportId: report.id, nextEvaluationDate: nextDate }
            });
        } else {
            await prisma.ges.update({
                where: { id: gesId },
                data: { technicalReportId: report.id, nextEvaluationDate: nextDate }
            });
        }
        return report;
    } 
    else if (meta.type === 'CUANTITATIVO') {
        if (!ges.technicalReportId) {
            throw new Error("Debe existir una Evaluación Cualitativa base para subir Cuantitativos.");
        }
        const quant = await prisma.quantitativeReport.create({
            data: {
                name: meta.reportName,
                reportDate: reportDate,
                pdfUrl: fileUrl,
                technicalReportId: ges.technicalReportId
            }
        });
        return quant;
    }
};