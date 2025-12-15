import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =================================================================
// 1. VIGILANCIA Y DOCUMENTOS (Tu lógica original)
// =================================================================
export const getSurveillanceData = async () => {
  // 1. Vigilancia Médica (Trabajadores)
  const medicalResults = await prisma.orderBattery.findMany({
    where: { expirationDate: { not: null } },
    include: {
      battery: true,
      order: { include: { worker: true, company: true, ges: true } }
    },
    orderBy: { expirationDate: 'asc' }
  });

  const now = new Date();
  const warningThreshold = new Date();
  warningThreshold.setDate(now.getDate() + 45);

  const surveillance = medicalResults.map(item => {
    const expDate = new Date(item.expirationDate!);
    let status = 'VIGENTE';
    if (expDate < now) status = 'VENCIDO';
    else if (expDate <= warningThreshold) status = 'POR_VENCER';

    return {
      id: item.id,
      workerName: item.order.worker.name,
      workerRut: item.order.worker.rut,
      companyName: item.order.company.name,
      gesName: item.order.ges.name,
      batteryName: item.battery.name,
      medicalStatus: item.status,
      expirationDate: item.expirationDate,
      surveillanceStatus: status
    };
  });

  // 2. Gestión Documental (Prescripciones)
  const prescriptions = await prisma.prescription.findMany();
  
  const prescriptionStats = {
    total: prescriptions.length,
    pendientes: prescriptions.filter(p => p.status === 'PENDIENTE').length,
    enProceso: prescriptions.filter(p => p.status === 'EN_PROCESO').length,
    realizadas: prescriptions.filter(p => p.status === 'REALIZADA').length,
    vencidas: prescriptions.filter(p => p.implementationDate < now && p.status !== 'REALIZADA').length
  };

  // 3. Cobertura de Informes (GES con PDF)
  const totalGes = await prisma.ges.count();
  const gesWithReport = await prisma.ges.count({
    where: { technicalReportId: { not: null } }
  });

  return {
    surveillance,      // Lista detallada médica
    prescriptionStats, // Resumen medidas de control
    documentStats: {   // Resumen informes
        totalGes,
        withReport: gesWithReport,
        coverage: totalGes > 0 ? Math.round((gesWithReport / totalGes) * 100) : 0
    }
  };
};

// =================================================================
// 2. ANÁLISIS DE CENTROS DE COSTOS (Tu lógica original)
// =================================================================
export const getCostCenterAnalytics = async () => {
    const centers = await prisma.costCenter.findMany({
        include: {
            workers: {
                select: {
                    id: true,
                    examOrders: { select: { id: true } } 
                }
            }
        }
    });

    const stats = centers.map(cc => {
        const workerCount = cc.workers.length;
        const orderCount = cc.workers.reduce((acc, curr) => acc + curr.examOrders.length, 0);
        
        return {
            name: cc.name,
            code: cc.code,
            workers: workerCount,
            orders: orderCount
        };
    });

    return stats.sort((a, b) => b.orders - a.orders).slice(0, 5);
};

// =================================================================
// 3. 🦅 NUEVO: DASHBOARD KPI & RIESGOS (VISTA DE ÁGUILA)
// =================================================================
export const getDashboardStats = async (companyId?: string) => {
    
    // Filtro base: Si mandan companyId filtramos, si no, traemos todo (para superadmin)
    const whereCompany = companyId ? { companyId } : {};

    // A. DOTACIÓN TOTAL (Solo Nómina)
    const totalWorkers = await prisma.worker.count({
        where: { 
            ...whereCompany,
            employmentStatus: 'NOMINA',
            active: true
        }
    });

    // B. TRABAJADORES EN TRÁNSITO (Candidatos)
    const transitWorkers = await prisma.worker.count({
        where: {
            ...whereCompany,
            employmentStatus: 'TRANSITO',
            active: true
        }
    });

    // C. ALERTAS DE VENCIMIENTO (Próximos 45 días)
    const next45Days = new Date();
    next45Days.setDate(next45Days.getDate() + 45);

    // Buscamos Baterías (Exámenes específicos) que vencen pronto y están APTAS
    const expiringExams = await prisma.orderBattery.count({
        where: {
            order: { worker: { ...whereCompany, active: true } },
            expirationDate: {
                gte: new Date(), // Desde hoy
                lte: next45Days  // Hasta 45 días más
            },
            status: 'APTO' // Solo nos preocupan los que estaban aptos y van a vencer
        }
    });

    // D. MAPA DE RIESGOS (Top 5 Agentes más frecuentes)
    // Usamos la nueva tabla 'ExposureHistory' para saber la realidad actual
    const activeExposures = await prisma.exposureHistory.findMany({
        where: {
            worker: { ...whereCompany, active: true },
            isActive: true
        },
        include: {
            ges: {
                include: {
                    riskExposures: {
                        include: { riskAgent: true }
                    }
                }
            }
        }
    });

    // Procesamiento manual para contar agentes
    const riskCounts: Record<string, number> = {};
    
    activeExposures.forEach(exp => {
        if (exp.ges && exp.ges.riskExposures) {
            exp.ges.riskExposures.forEach(riskExp => {
                const agentName = riskExp.riskAgent?.name || 'Agente Sin Nombre';
                riskCounts[agentName] = (riskCounts[agentName] || 0) + 1;
            });
        }
    });

    // Convertir a array y ordenar top 5
    const topRisks = Object.entries(riskCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // E. CÁLCULO DE CUMPLIMIENTO GLOBAL
    // Trabajadores activos que tienen al menos un examen APTO vigente
    // (Simplificación para KPI visual)
    const workersWithValidExams = await prisma.worker.count({
        where: {
            ...whereCompany,
            employmentStatus: 'NOMINA',
            active: true,
            examOrders: {
                some: {
                    orderBatteries: {
                        some: {
                            status: 'APTO',
                            expirationDate: { gte: new Date() }
                        }
                    }
                }
            }
        }
    });

    const complianceRate = totalWorkers > 0 
        ? Math.round((workersWithValidExams / totalWorkers) * 100) 
        : 0;

    return {
        population: {
            total: totalWorkers,
            transit: transitWorkers
        },
        alerts: {
            expiringSoon: expiringExams
        },
        compliance: {
            rate: complianceRate,
            covered: workersWithValidExams,
            pending: totalWorkers - workersWithValidExams
        },
        topRisks: topRisks
    };
};