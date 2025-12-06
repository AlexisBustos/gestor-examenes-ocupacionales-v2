import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HELPERS ---
const normalizeText = (text: string) => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

// 👇 MEJORA 1: Diccionario ampliado con casos específicos
const KEYWORD_MAP: Record<string, string> = {
  'ruido': 'RUIDO', 'prexor': 'RUIDO', 
  'silice': 'SÍLICE', 'polvo': 'SÍLICE',
  'solvente': 'SOLVENTES', 'tolueno': 'TOLUENO', 'xileno': 'XILENO',
  'metal': 'METALES', 'humo': 'HUMOS', 
  'manganeso': 'MANGANESO', 'plomo': 'PLOMO', 'hierro': 'HIERRO', // <--- AGREGADO HIERRO
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

    // 👇 MEJORA 2: PRIORIDAD AL DETALLE ESPECÍFICO (EL "APELLIDO")
    // Si el detalle es "Hierro", busca primero una batería que se llame "Hierro"
    if (details.length > 2) { // Solo si hay un detalle válido
        const specificBattery = allBatteries.find(b => normalizeText(b.name).includes(details));
        if (specificBattery) {
            suggestions.push(specificBattery);
            matched = true;
        }
    }

    // 2. Búsqueda por Diccionario (Mapa de Palabras Clave)
    for (const [trigger, target] of Object.entries(KEYWORD_MAP)) {
      // Usamos regex para buscar la palabra completa y evitar falsos positivos parciales
      if (fullText.includes(trigger)) {
        // OJO: Usamos filter en vez de find para traer TODAS las coincidencias posibles
        // Ej: Si dice "Metales", podría traer Manganeso y Hierro si ambos tienen la etiqueta "Metales"
        // Pero para ser precisos, buscamos la batería que coincida con el TARGET del mapa
        const bat = allBatteries.find(b => normalizeText(b.name).includes(normalizeText(target)));
        
        // Solo agregamos si no la hemos agregado ya en el paso 1
        if (bat) { 
             suggestions.push(bat); 
             matched = true; 
        }
      }
    }

    // 3. Fallback: Si no encontró nada, busca por el nombre del Agente General
    if (!matched) {
        const bat = allBatteries.find(b => normalizeText(b.name).includes(agentName));
        if (bat) suggestions.push(bat);
    }
  }

  // Eliminar duplicados por ID
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
  
  // Prioridad 1: Baterías manuales asignadas al GES
  if (ges.examBatteries && ges.examBatteries.length > 0) return ges.examBatteries;
  
  // Prioridad 2: Cálculo automático basado en riesgos
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

// --- GESTIÓN DOCUMENTAL ---
export const getGesDocuments = async (gesId: string) => {
    const ges = await prisma.ges.findUnique({
        where: { id: gesId },
        include: { technicalReport: true }
    });

    if (!ges || !ges.technicalReport) return [];

    const quantitativeReports = await prisma.quantitativeReport.findMany({
        where: { technicalReportId: ges.technicalReport.id },
        orderBy: { reportDate: 'desc' }
    });

    return [
        {
            id: ges.technicalReport.id,
            name: `Evaluación Cualitativa ${ges.technicalReport.reportNumber}`,
            type: 'CUALITATIVO',
            reportDate: ges.technicalReport.reportDate,
            url: ges.technicalReport.pdfUrl,
            valid: true 
        },
        ...quantitativeReports.map(q => ({
            id: q.id,
            name: q.name || 'Medición Cuantitativa',
            type: 'CUANTITATIVO',
            reportDate: q.reportDate,
            url: q.pdfUrl,
            valid: true
        }))
    ];
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
    }
    
    throw new Error("Tipo de documento no válido");
};

// 👇 NUEVO: HISTORIAL COMPLETO
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

    // Mapeo limpio a la estructura DTO solicitada
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
        technicalReport: ges.technicalReport ? {
            id: ges.technicalReport.id,
            reportNumber: ges.technicalReport.reportNumber,
            reportDate: ges.technicalReport.reportDate,
            pdfUrl: ges.technicalReport.pdfUrl,
            prescriptions: ges.technicalReport.prescriptions,
            quantitativeReports: ges.technicalReport.quantitativeReports
        } : null
    };
};