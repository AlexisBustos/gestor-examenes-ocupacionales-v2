import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSurveillanceData = async () => {
  // 1. Buscamos todos los resultados de baterías que tengan fecha de vencimiento
  const results = await prisma.orderBattery.findMany({
    where: {
      expirationDate: { not: null } // Solo los que tienen fecha
    },
    include: {
      battery: true,
      order: {
        include: {
          worker: true,
          company: true,
          ges: true
        }
      }
    },
    orderBy: { expirationDate: 'asc' } // Los más urgentes primero
  });

  // 2. Procesamos para determinar el estado del semáforo
  const now = new Date();
  const warningThreshold = new Date();
  warningThreshold.setDate(now.getDate() + 45); // Alerta 45 días antes (puedes ajustar a 30)

  return results.map(item => {
    const expDate = new Date(item.expirationDate!);
    let surveillanceStatus = 'VIGENTE';

    if (expDate < now) {
      surveillanceStatus = 'VENCIDO';
    } else if (expDate <= warningThreshold) {
      surveillanceStatus = 'POR_VENCER';
    }

    return {
      id: item.id,
      workerName: item.order.worker.name,
      workerRut: item.order.worker.rut,
      companyName: item.order.company.name,
      gesName: item.order.ges.name,
      batteryName: item.battery.name,
      medicalStatus: item.status, // APTO, NO_APTO, etc.
      expirationDate: item.expirationDate,
      surveillanceStatus // El color del semáforo
    };
  });
};