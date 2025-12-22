import { PrismaClient } from '@prisma/client';
import { startOfDay, addDays, isBefore, differenceInDays, addYears } from 'date-fns';

const prisma = new PrismaClient();

const DAYS_TO_WARN_DOCS = 30;
const DAYS_TO_WARN_EXAMS = 45;

export const getSystemAlerts = async () => {
    const today = startOfDay(new Date());
    const warningDateDocs = addDays(today, DAYS_TO_WARN_DOCS);
    const warningDateExams = addDays(today, DAYS_TO_WARN_EXAMS);

    // ... dentro de getSystemAlerts ...

    // =================================================================
    // 1. MOTOR DE PRESCRIPCIONES (Medidas) - CORREGIDO
    // =================================================================
    const prescriptions = await prisma.prescription.findMany({
        where: { 
            status: { not: 'REALIZADA' },
            implementationDate: { not: undefined } 
        },
        include: { 
            riskAgent: true,
            technicalReport: { include: { company: true } },
            quantitativeReport: { include: { technicalReport: { include: { company: true } } } }
        }
    });

    // Usamos Promise.all para hacer búsquedas async dentro del mapa
    const prescriptionAlertsPromises = prescriptions.map(async (p) => {
        if (!p.implementationDate) return null;
        const deadline = new Date(p.implementationDate);
        const daysLeft = differenceInDays(deadline, today);
        
        let status = 'VIGENTE';
        if (isBefore(deadline, today)) status = 'VENCIDO';
        else if (isBefore(deadline, warningDateDocs)) status = 'POR_VENCER';

        if (status === 'VIGENTE') return null;

        let originType = 'General';
        let companyName = 'Empresa Desconocida';
        let sourceReport = '';
        let companyId = '';
        let technicalReportId = ''; // ID del informe padre para buscar el GES

        if (p.quantitativeReport) {
            originType = 'Cuantitativa';
            companyName = p.quantitativeReport.technicalReport?.company?.name || 'N/A';
            companyId = p.quantitativeReport.technicalReport?.companyId || '';
            sourceReport = p.quantitativeReport.name || 'Informe Medición';
            technicalReportId = p.quantitativeReport.technicalReportId;
        } else if (p.technicalReport) {
            originType = 'Cualitativa';
            companyName = p.technicalReport.company?.name || 'N/A';
            companyId = p.technicalReport.companyId || '';
            sourceReport = `Informe ${p.technicalReport.reportNumber}`;
            technicalReportId = p.technicalReport.id;
        }

        // 🧠 BÚSQUEDA INTELIGENTE DEL GES PADRE
        // Buscamos qué GES tiene asociado este Informe Técnico
        let parentGesId = null;
        if (technicalReportId) {
            const ges = await prisma.ges.findFirst({
                where: { technicalReportId: technicalReportId },
                select: { id: true }
            });
            parentGesId = ges?.id;
        }

        return {
            type: 'PRESCRIPCION',
            id: p.id,
            title: `Medida: ${p.riskAgent?.name || 'Generica'} (${originType})`,
            company: companyName,
            date: p.implementationDate,
            daysLeft,
            status,
            details: `${p.description?.substring(0, 80)}... [Fuente: ${sourceReport}]`,
            // 👇 COORDENADAS PARA EL TRIPLE SALTO
            redirectData: {
                companyId,
                action: 'OPEN_GES_MODAL', // 1. Ir a Empresa
                gesId: parentGesId,       // 2. Abrir GES
                reportId: technicalReportId, // 3. Identificar reporte
                subAction: 'OPEN_MEASURES'   // 4. Abrir Medidas
            }
        };
    });

    const prescriptionAlerts = (await Promise.all(prescriptionAlertsPromises)).filter(Boolean);

    // ... continuar con el resto (gesAlerts, docAlerts...)

    // ... dentro de getSystemAlerts ...

    // =================================================================
    // 2. MOTOR DE VIGENCIA GES (CORREGIDO: Redirige a Empresa/Modal)
    // =================================================================
    const gesGroups = await prisma.ges.findMany({
        where: { nextEvaluationDate: { not: null } },
        include: { area: { include: { workCenter: { include: { company: true } } } } }
    });

    const gesAlerts = gesGroups.map(ges => {
        if (!ges.nextEvaluationDate) return null;
        const deadline = new Date(ges.nextEvaluationDate);
        const daysLeft = differenceInDays(deadline, today);

        let status = 'VIGENTE';
        if (isBefore(deadline, today)) status = 'VENCIDO';
        else if (isBefore(deadline, warningDateDocs)) status = 'POR_VENCER';

        if (status === 'VIGENTE') return null;

        return {
            type: 'EXAMENES_GES',
            id: ges.id,
            title: `Renovación Protocolo: ${ges.name}`,
            company: ges.area.workCenter.company.name,
            date: ges.nextEvaluationDate,
            daysLeft,
            status,
            details: `La vigencia del protocolo completo expira pronto.`,
            // 👇 AQUÍ ESTÁ EL CAMBIO: Ahora enviamos datos para abrir el modal en Empresas
            redirectData: {
                companyId: ges.area.workCenter.company.id, // ID del Padre
                action: 'OPEN_GES_MODAL',                  // Orden de apertura
                gesId: ges.id                              // ID del Hijo (GES)
            }
        };
    }).filter(Boolean);

    // ... resto del código ...

    // ... dentro de getSystemAlerts ...

    // 3. MOTOR DE DOCUMENTACIÓN LEGAL (CORREGIDO SEGÚN SCHEMA)
    const reports = await prisma.technicalReport.findMany({
        include: { company: true }
    });

    const docAlertsPromises = reports.map(async (rep) => {
        const reportDate = new Date(rep.reportDate);
        const expirationDate = addDays(reportDate, 730);
        const daysLeft = differenceInDays(expirationDate, today);

        let status = 'VIGENTE';
        if (isBefore(expirationDate, today)) status = 'VENCIDO';
        else if (isBefore(expirationDate, warningDateDocs)) status = 'POR_VENCER';

        if (status === 'VIGENTE') return null;

        // 🔍 CORRECCIÓN MAESTRA: Buscamos el GES que tiene este reporte asociado directamente
        const parentGes = await prisma.ges.findFirst({
            where: {
                technicalReportId: rep.id // 👈 Relación directa según tu Schema
            },
            select: { id: true }
        });

        return {
            type: 'DOCUMENTACION',
            id: rep.id,
            title: `Informe Caducado: ${rep.reportNumber}`,
            company: rep.company.name,
            date: expirationDate,
            daysLeft,
            status,
            details: 'Informe técnico requiere renovación (2 años).',
            redirectData: {
                companyId: rep.companyId,
                action: 'OPEN_GES_MODAL',
                reportId: rep.id,
                gesId: parentGes?.id // Si encontramos el GES, enviamos su ID
            }
        };
    });

    // ... resto del código ...

    const docAlerts = (await Promise.all(docAlertsPromises)).filter(Boolean);

   // =================================================================
    // 4. MOTOR DE EXÁMENES DE TRABAJADORES (PRIORIDAD: FECHA REAL)
    // =================================================================
    const workers = await prisma.worker.findMany({
        where: { 
            employmentStatus: 'NOMINA',
            currentGesId: { not: null }
        },
        include: {
            company: true,
            currentGes: true,
            examOrders: {
                where: { status: { in: ['CERRADO', 'REALIZADO'] } },
                orderBy: { updatedAt: 'desc' }, 
                take: 1,
                // 👇 IMPERATIVO: Incluir las baterías para leer su fecha de vencimiento
                include: { orderBatteries: true } 
            }
        }
    });

    const workerAlerts = workers.map(w => {
        if (!w.examOrders || w.examOrders.length === 0) return null;
        if (!w.currentGes) return null;

        const lastExam = w.examOrders[0];
        let expirationDate: Date;
        let expirationSource = 'Calculado';

        // 🧠 LÓGICA DE PRIORIDAD
        // 1. Buscamos si alguna batería tiene fecha de vencimiento explícita
        const batteriesWithExpiration = lastExam.orderBatteries
            .filter((b: any) => b.expirationDate)
            .map((b: any) => new Date(b.expirationDate));

        if (batteriesWithExpiration.length > 0) {
            // Ordenamos ascendente (la fecha más próxima a vencer es la que manda)
            batteriesWithExpiration.sort((a: Date, b: Date) => a.getTime() - b.getTime());
            expirationDate = batteriesWithExpiration[0];
            expirationSource = 'Médico';
        } else {
            // 2. Si no hay fechas explícitas, usamos el cálculo (Fallback)
            const examDate = lastExam.scheduledAt 
                ? new Date(lastExam.scheduledAt) 
                : new Date(lastExam.updatedAt);
            
            const validityYears = w.currentGes.validityYears || 1; 
            expirationDate = addYears(examDate, validityYears);
        }

        const daysLeft = differenceInDays(expirationDate, today);

        let status = 'VIGENTE';
        if (isBefore(expirationDate, today)) status = 'VENCIDO';
        else if (isBefore(expirationDate, warningDateExams)) status = 'POR_VENCER';

        if (status === 'VIGENTE') return null;

        return {
            type: 'EXAMEN_TRABAJADOR',
            id: w.id,
            title: `Examen ${status === 'VENCIDO' ? 'Vencido' : 'Por Vencer'}: ${w.name}`,
            company: w.company?.name || 'Empresa',
            date: expirationDate,
            daysLeft,
            status,
            details: `Vencimiento: ${expirationDate.toLocaleDateString()} (${expirationSource}).`,
            redirectData: {
                workerRut: w.rut,
                action: 'OPEN_WORKER_SHEET',
                workerId: w.id
            }
        };
    }).filter(Boolean);

    // ... resto del código ...

    // RESUMEN FINAL
    const allItems = [...prescriptionAlerts, ...gesAlerts, ...docAlerts, ...workerAlerts];

    allItems.sort((a: any, b: any) => {
        if (a.status === 'VENCIDO' && b.status !== 'VENCIDO') return -1;
        if (a.status !== 'VENCIDO' && b.status === 'VENCIDO') return 1;
        return a.daysLeft - b.daysLeft;
    });

    return {
        summary: {
            total: allItems.length,
            expired: allItems.filter(a => a?.status === 'VENCIDO').length,
            warning: allItems.filter(a => a?.status === 'POR_VENCER').length,
        },
        items: allItems
    };
};