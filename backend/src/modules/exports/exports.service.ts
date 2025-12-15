import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

// =================================================================
// REPORTE 1: SÁBANA DE VIGILANCIA MÉDICA
// =================================================================
export const generateSurveillanceReport = async (companyId?: string) => {
    // 1. Buscamos los datos
    const whereCondition = companyId ? { order: { companyId } } : {};

    const records = await prisma.orderBattery.findMany({
        where: {
            ...whereCondition,
            status: { in: ['APTO', 'NO_APTO', 'APTO_CON_OBSERVACIONES'] },
            expirationDate: { not: null }
        },
        include: {
            battery: true,
            order: {
                include: {
                    worker: { include: { costCenter: true } },
                    company: true,
                    ges: true
                }
            }
        },
        orderBy: { order: { worker: { name: 'asc' } } }
    });

    // 2. Mapeamos a filas de Excel
    const data = records.map(rec => {
        const worker = rec.order.worker;
        const now = new Date();
        const expDate = new Date(rec.expirationDate!);
        
        let estadoVigilancia = 'VIGENTE';
        if (expDate < now) estadoVigilancia = 'VENCIDO';
        else if (expDate.getTime() - now.getTime() < (45 * 24 * 60 * 60 * 1000)) estadoVigilancia = 'POR VENCER';

        return {
            "RUT": worker.rut,
            "Trabajador": worker.name,
            "Empresa": rec.order.company.name,
            "Centro de Costo": worker.costCenter?.name || 'N/A',
            "Cargo (GES)": rec.order.ges.name,
            "Examen / Batería": rec.battery.name,
            "Resultado Médico": rec.status,
            "Fecha Realización": rec.order.updatedAt.toISOString().split('T')[0],
            "Fecha Vencimiento": rec.expirationDate?.toISOString().split('T')[0],
            "Estado Vigilancia": estadoVigilancia
        };
    });

    // 3. Generamos el archivo
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    const wscols = [
        { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, 
        { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }
    ];
    worksheet['!cols'] = wscols;

    xlsx.utils.book_append_sheet(workbook, worksheet, "Vigilancia Médica");
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

// =================================================================
// REPORTE 2: DOTACIÓN Y RIESGOS
// =================================================================
export const generateHeadcountReport = async (companyId?: string) => {
    const whereCondition = companyId ? { companyId } : {};

    const workers = await prisma.worker.findMany({
        where: { ...whereCondition, active: true },
        include: {
            company: true,
            costCenter: true,
            currentGes: { include: { risks: { include: { risk: true } } } }
        }
    });

    const data = workers.map(w => ({
        "RUT": w.rut,
        "Nombre": w.name,
        "Email": w.email || '-',
        "Teléfono": w.phone || '-',
        "Empresa": w.company.name,
        "Centro Costo": w.costCenter?.name || '-',
        "Puesto (GES)": w.currentGes?.name || 'Sin Asignar',
        "Riesgos Asociados": w.currentGes?.risks.map(r => r.risk.name).join(', ') || 'Ninguno',
        "Estado": w.employmentStatus
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Dotación Activa");

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};