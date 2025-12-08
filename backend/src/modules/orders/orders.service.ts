import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

/**
 * Crear una orden de exámenes CON HOMOLOGACIÓN AUTOMÁTICA.
 * Si el trabajador ya tiene un examen vigente, lo incluimos en la nueva orden
 * pero ya marcado como APTO/REALIZADO y con una nota explicativa.
 */
export const createOrder = async (data: any) => {
  // 1. Extraer ID del trabajador
  const workerId = data.worker?.connect?.id;
  const requestedBatteries = data.orderBatteries?.create;

  if (workerId && Array.isArray(requestedBatteries) && requestedBatteries.length > 0) {
    
    // 2. Buscar Historial Vigente
    const validBatteries = await prisma.orderBattery.findMany({
      where: {
        order: { 
          workerId: workerId,
          status: { not: 'ANULADO' } 
        },
        status: { in: ['APTO', 'APTO_CON_OBSERVACIONES'] },
        expirationDate: { gt: new Date() }
      },
      // Traemos más datos para poder copiar la información
      select: { 
        batteryId: true, 
        status: true, 
        expirationDate: true 
      }
    });

    // Creamos un mapa para acceso rápido: ID -> Datos del examen vigente
    const coveredMap = new Map();
    validBatteries.forEach(b => {
      coveredMap.set(b.batteryId, b);
    });

    // 3. Procesar la lista de baterías solicitadas
    const processedBatteries = requestedBatteries.map((item: any) => {
      const incomingId = item.batteryId || item.battery?.connect?.id;
      
      // Verificamos si este examen ya está cubierto/vigente
      const existingExam = coveredMap.get(incomingId);

      if (existingExam) {
        // CASO A: YA EXISTE VIGENTE -> LO HOMOLOGAMOS
        // En lugar de borrarlo, lo creamos pero ya "listo"
        return {
          batteryId: incomingId, // Mismo ID
          status: existingExam.status, // Heredamos el estado (APTO)
          expirationDate: existingExam.expirationDate, // Heredamos la fecha de vencimiento
          resultDate: new Date(), // Fecha de "hoy" como fecha de convalidación
          clinicalNotes: "✅ CONVALIDADO: Examen vigente detectado en historial." // Nota explicativa
        };
      } else {
        // CASO B: NO EXISTE -> LO CREAMOS PENDIENTE (Como siempre)
        return item; // Se mantiene tal cual (PENDIENTE)
      }
    });

    // 4. Reemplazamos la lista original con la lista procesada
    data.orderBatteries.create = processedBatteries;
  }

  // 5. Crear la orden
  const newOrder = await prisma.examOrder.create({
    data,
  });

  // 6. Recalcular estado inmediato
  // Como insertamos exámenes ya "listos", puede que la orden nazca parcialmente completa.
  // Ejecutamos el recálculo para que el estado global (SOLICITADO/REALIZADO) sea coherente.
  await recalculateOrderStatus(newOrder.id);

  return newOrder;
};

// --- EL RESTO DE LAS FUNCIONES SE MANTIENEN IGUALES ---

export const getWorkerOrderSuggestions = async (
  workerId: string,
  gesId?: string
) => {
  const where: Prisma.ExamOrderWhereInput = {
    workerId,
    ...(gesId ? { gesId } : {}),
  };

  return prisma.examOrder.findMany({
    where,
    include: {
      ges: true,
      orderBatteries: {
        include: {
          battery: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });
};

export const getAllOrders = async (status?: string) => {
  const where: Prisma.ExamOrderWhereInput = status
    ? { status: status as any }
    : {};

  return prisma.examOrder.findMany({
    where,
    include: {
      worker: true,
      company: true,
      ges: true,
      orderBatteries: {
        include: {
          battery: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getOrderById = async (id: string) => {
  return prisma.examOrder.findUnique({
    where: { id },
    include: {
      worker: true,
      company: true,
      ges: {
        include: {
          riskExposures: {
            include: {
              riskAgent: true 
            }
          }
        }
      },
      orderBatteries: {
        include: {
          battery: true,
        },
      },
    },
  });
};

export const updateOrderStatus = async (
  id: string,
  status: string,
  scheduledAt?: string | null,
  providerName?: string | null,
  externalId?: string | null
) => {
  return prisma.examOrder.update({
    where: { id },
    data: {
      status: status as any,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      providerName: providerName ?? null,
      externalId: externalId ?? null,
    },
  });
};

export const recalculateOrderStatus = async (orderId: string) => {
  const order = await prisma.examOrder.findUnique({
    where: { id: orderId },
    include: {
      orderBatteries: true,
    },
  });

  if (!order) return;

  if (order.status === 'ANULADO' || order.status === 'CERRADO') {
    return order.status;
  }

  const batteries = order.orderBatteries;

  if (!batteries || batteries.length === 0) {
    const statusFromSchedule = order.scheduledAt ? 'AGENDADO' : 'SOLICITADO';

    if (statusFromSchedule !== order.status) {
      await prisma.examOrder.update({
        where: { id: order.id },
        data: { status: statusFromSchedule },
      });
    }

    return statusFromSchedule;
  }

  const allEvaluated = batteries.every(
    (b: {
      status: 'PENDIENTE' | 'APTO' | 'NO_APTO' | 'APTO_CON_OBSERVACIONES';
    }) => b.status !== 'PENDIENTE'
  );

  let newStatus = order.status;

  if (allEvaluated) {
    newStatus = 'REALIZADO';
  } else if (order.scheduledAt) {
    newStatus = 'AGENDADO';
  } else {
    newStatus = 'SOLICITADO';
  }

  if (newStatus !== order.status) {
    await prisma.examOrder.update({
      where: { id: order.id },
      data: { status: newStatus },
    });
  }

  return newStatus;
};

export const updateBatteryResult = async (
  batteryId: string,
  status: 'PENDIENTE' | 'APTO' | 'NO_APTO' | 'APTO_CON_OBSERVACIONES',
  expirationDate?: string | null,
  resultDate?: string | null,
  clinicalNotes?: string | null
) => {
  const battery = await prisma.orderBattery.findUnique({
    where: { id: batteryId },
    include: { order: true },
  });

  if (!battery) {
    throw new Error('OrderBattery no encontrada');
  }

  const updateData: Prisma.OrderBatteryUpdateInput = {
    status,
    resultDate: resultDate ? new Date(resultDate) : null,
    expirationDate:
      status === 'APTO' && expirationDate
        ? new Date(expirationDate)
        : null,
    clinicalNotes: clinicalNotes ?? null,
  };

  const updatedBattery = await prisma.orderBattery.update({
    where: { id: batteryId },
    data: updateData,
  });

  await recalculateOrderStatus(battery.orderId);

  return updatedBattery;
};