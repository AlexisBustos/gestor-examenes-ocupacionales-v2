import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HELPERS ---
const normalizeText = (text: string) => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

const KEYWORD_MAP: Record<string, string> = {
  'ruido': 'RUIDO', 'prexor': 'RUIDO', 
  'silice': 'SÍLICE', 'polvo': 'SÍLICE',
  'solvente': 'SOLVENTES', 'tolueno': 'TOLUENO', 'xileno': 'XILENO',
  'metal': 'METALES', 'humo': 'HUMOS', 
  'manganeso': 'MANGANESO', 'plomo': 'PLOMO', 'hierro': 'HIERRO',
  'soldadura': 'HUMOS', 'respirable': 'SÍLICE',
  'calor': 'ESTRÉS', 'termico': 'ESTRÉS', 
  'altura': 'ALTURA', 'vibracion': 'VIBRACIONES',
  'uv': 'UV', 'solar': 'UV'
};

const findBatteriesByKeywords = async (riskExposures: any[]) => {
  const allBatteries = await prisma.examBattery.findMany();
  let suggestions: any[] = [];

  for (const riskExp of riskExposures) {
    const agentName = normalizeText(riskExp.riskAgent.name);
    const details = normalizeText(riskExp.specificAgentDetails || "");
    const fullText = `${agentName} ${details}`;
    
    let matched = false;

    if (details.length > 2) { 
        const specificBattery = allBatteries.find(b => normalizeText(b.name).includes(details));
        if (specificBattery) {
            suggestions.push(specificBattery);
            matched = true;
        }
    }

    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      if (fullText.includes(trigger)) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
        if (bat) { 
             suggestions.push(bat); 
             matched = true; 
        }
      }
    }

    if (!matched) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(agentName));
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
      technicalReport: { include: { prescriptions: true } },
      tmertReports: { include: { prescriptions: true } } // 👇 Incluimos TMERT aquí también
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

// --- GESTIÓN DOCUMENTAL (Cualitativo, Cuantitativo y TMERT) ---
export const getGesDocuments = async (gesId: string) => {
    const ges = await prisma.ges.findUnique({
        where: { id: gesId },
        include: { 
            technicalReport: true,
            tmertReports: { orderBy: { reportDate: 'desc' } } // 👇 Traemos los TMERT
        }
    });

    if (!ges) return [];

    let documents: any[] = [];

    // 1. Cualitativo (Si existe)
    if (ges.technicalReport) {
        documents.push({
            id: ges.technicalReport.id,
            name: `Evaluación Cualitativa ${ges.technicalReport.reportNumber}`,
            type: 'CUALITATIVO',
            reportDate: ges.technicalReport.reportDate,
            url: ges.technicalReport.pdfUrl,
            valid: true 
        });

        // 2. Cuantitativos (Dependen del cualitativo)
        const quantitativeReports = await prisma.quantitativeReport.findMany({
            where: { technicalReportId: ges.technicalReport.id },
            orderBy: { reportDate: 'desc' }
        });

        documents.push(...quantitativeReports.map(q => ({
            id: q.id,
            name: q.name || 'Medición Cuantitativa',
            type: 'CUANTITATIVO',
            reportDate: q.reportDate,
            url: q.pdfUrl,
            valid: true
        })));
    }

    // 3. TMERT (Independientes, específicos del GES) 👇
    if (ges.tmertReports && ges.tmertReports.length > 0) {
        documents.push(...ges.tmertReports.map(t => ({
            id: t.id,
            name: t.name || 'Informe TMERT',
            type: 'TMERT', // Etiqueta para el frontend
            reportDate: t.reportDate,
            url: t.pdfUrl,
            valid: true
        })));
    }

    return documents;
};

// 👇 AQUÍ ESTÁ LA LÓGICA DE SUBIDA ACTUALIZADA
export const uploadGesDocument = async (gesId: string, file: any, meta: any) => {
    const ges = await prisma.ges.findUnique({ 
        where: { id: gesId }, 
        include: { area: { include: { workCenter: true } } } 
    });
    
    if (!ges) throw new Error("GES no encontrado");

    const fileUrl = file.location; 
    const reportDate = new Date(meta.reportDate);

    // OPCIÓN A: CUALITATIVO
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

    // OPCIÓN B: CUANTITATIVO
    } else if (meta.type === 'CUANTITATIVO') {
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

    // OPCIÓN C: TMERT (NUEVO) 👇
    } else if (meta.type === 'TMERT') {
        const tmert = await prisma.tmertReport.create({
            data: {
                name: meta.reportName || 'Informe TMERT',
                reportDate: reportDate,
                pdfUrl: fileUrl,
                gesId: gesId // Conexión directa al GES
            }
        });
        return tmert;
    }
    
    throw new Error("Tipo de documento no válido");
};

// --- HISTORIAL COMPLETO (Incluye TMERT) ---
export const getGesFullHistory = async (gesId: string) => {
    const ges = await prisma.ges.findUnique({
        where: { id: gesId },
        include: {
            area: {
                include: {
                    workCenter: {
                        include: { company: true }
                    }
                }
            },
            // Incluimos historial TMERT 👇
            tmertReports: {
                orderBy: { reportDate: 'desc' },
                include: { prescriptions: true }
            },
            technicalReport: {
                include: {
                    prescriptions: true,
                    quantitativeReports: {
                        include: { prescriptions: true }
                    }
                }
            }
        }
    });

    if (!ges) return null;

    return {
        id: ges.id,
        name: ges.name,
        reportDate: ges.reportDate,
        reportNumber: ges.reportNumber,
        nextEvaluationDate: ges.nextEvaluationDate,
        area: {
            id: ges.area.id,
            name: ges.area.name,
            workCenter: {
                id: ges.area.workCenter.id,
                name: ges.area.workCenter.name,
                company: {
                    id: ges.area.workCenter.company.id,
                    name: ges.area.workCenter.company.name
                }
            }
        },
        // Estructura existente
        technicalReport: ges.technicalReport ? {
            id: ges.technicalReport.id,
            reportNumber: ges.technicalReport.reportNumber,
            reportDate: ges.technicalReport.reportDate,
            pdfUrl: ges.technicalReport.pdfUrl,
            prescriptions: ges.technicalReport.prescriptions,
            quantitativeReports: ges.technicalReport.quantitativeReports
        } : null,

        // Estructura nueva para frontend 👇
        tmertReports: ges.tmertReports.map(t => ({
            id: t.id,
            name: t.name,
            reportDate: t.reportDate,
            pdfUrl: t.pdfUrl,
            prescriptions: t.prescriptions
        }))
    };
};

export const removeTechnicalReport = async (id: string) => {
    return await prisma.technicalReport.delete({ where: { id } });
};

export const removeQuantitativeReport = async (id: string) => {
    return await prisma.quantitativeReport.delete({ where: { id } });
};

// 👇 Helper para eliminar TMERT
export const removeTmertReport = async (id: string) => {
    return await prisma.tmertReport.delete({ where: { id } });
};

// ... (al final del archivo ges.service.ts)

// 1. OBTENER RIESGOS (Lógica de BD)
export const getGesRisksDb = async (gesId: string) => {
  const relations = await prisma.gesRisk.findMany({
    where: { gesId },
    select: { riskId: true }
  });
  return relations.map(r => r.riskId);
};

// 2. ACTUALIZAR RIESGOS (Lógica de BD)
export const updateGesRisksDb = async (gesId: string, riskIds: string[]) => {
  await prisma.$transaction(async (tx) => {
    // Borrar viejos
    await tx.gesRisk.deleteMany({ where: { gesId } });

    // Crear nuevos
    if (riskIds && riskIds.length > 0) {
      await tx.gesRisk.createMany({
        data: riskIds.map((riskId) => ({
          gesId,
          riskId
        }))
      });
    }
  });
  return { success: true };
};