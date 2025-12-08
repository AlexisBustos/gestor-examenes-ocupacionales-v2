import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. LÓGICA ORIGINAL (Vigilancia y Documentos) ---
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

// 👇👇👇 AGREGADO NUEVO: ANÁLISIS DE CENTROS DE COSTOS 👇👇👇
export const getCostCenterAnalytics = async () => {
    // Buscamos todos los centros de costos y sus relaciones
    const centers = await prisma.costCenter.findMany({
        include: {
            workers: {
                select: {
                    id: true,
                    // Contamos las órdenes para saber la "actividad/gasto"
                    examOrders: { select: { id: true } } 
                }
            }
        }
    });

    // Procesamos la data
    const stats = centers.map(cc => {
        const workerCount = cc.workers.length;
        // Sumamos el total de órdenes de todos los trabajadores de este centro
        const orderCount = cc.workers.reduce((acc, curr) => acc + curr.examOrders.length, 0);
        
        return {
            name: cc.name,
            code: cc.code,
            workers: workerCount,
            orders: orderCount
        };
    });

    // Ordenamos: Los que tienen más actividad (órdenes) primero
    // Devolvemos el Top 5 para el gráfico
    return stats.sort((a, b) => b.orders - a.orders).slice(0, 5);
};