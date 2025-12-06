import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

/**
 * Crear una orden de exámenes.
 * (Compatibilidad con el controller actual)
 */
export const createOrder = async (data: any) => {
  return prisma.examOrder.create({
    data,
  });
};

/**
 * Sugerencias de órdenes para un trabajador.
 *
 * Firma compatible con el controller:
 *   getWorkerOrderSuggestions(workerId, gesId?)
 */
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

/**
 * Obtener todas las órdenes, opcionalmente filtradas por estado.
 * Esto alimenta la tabla de Órdenes en el frontend.
 */
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

/**
 * Obtener una orden específica por ID, con sus relaciones.
 */
export const getOrderById = async (id: string) => {
  return prisma.examOrder.findUnique({
    where: { id },
    include: {
      worker: true,
      company: true,
      // 👇 AQUÍ ESTÁ LA CORRECCIÓN
      ges: {
        include: {
          riskExposures: {
            include: {
              riskAgent: true // <--- ¡Esto traerá los nombres (Ruido, Sílice, etc)!
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

/**
 * Actualizar el estado general de la orden (cambios manuales o al agendar).
 *
 * Firma compatible con el controller:
 *   updateOrderStatus(id, status, scheduledAt, providerName, externalId)
 */
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

/**
 * Recalcula el estado global de la ORDEN según:
 * - Estado de sus baterías (PENDIENTE / APTO / NO_APTO / APTO_CON_OBSERVACIONES)
 * - Si tiene o no fecha de agenda (scheduledAt)
 *
 * Regla:
 * - Si TODAS las baterías tienen dictamen (ninguna PENDIENTE) → REALIZADO
 * - Si NO todas tienen dictamen y hay scheduledAt → AGENDADO
 * - Si NO todas tienen dictamen y NO hay scheduledAt → SOLICITADO
 * - Si está ANULADO o CERRADO → no se toca
 */
export const recalculateOrderStatus = async (orderId: string) => {
  const order = await prisma.examOrder.findUnique({
    where: { id: orderId },
    include: {
      orderBatteries: true,
    },
  });

  if (!order) return;

  // No tocar si está anulada o cerrada
  if (order.status === 'ANULADO' || order.status === 'CERRADO') {
    return order.status;
  }

  const batteries = order.orderBatteries;

  // Si no hay baterías, la lógica depende solo de la agenda
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

  // TS: tipamos explícitamente 'b' para evitar any
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

/**
 * Actualizar resultado clínico de una batería específica.
 *
 * Firma compatible con el controller actual:
 *   updateBatteryResult(
 *     batteryId,
 *     status,
 *     expirationDate,
 *     resultDate,
 *     clinicalNotes
 *   )
 *
 * OJO: el controller hoy la llama en este orden:
 *   updateBatteryResult(id, status, expirationDate, resultDate, clinicalNotes)
 *
 * Regla de negocio:
 * - Solo APTO puede tener fecha de caducidad.
 *   - Si status !== 'APTO' → expirationDate se fuerza a null.
 * - resultDate puede existir para cualquier dictamen.
 *
 * Además:
 * - Recalcula el estado global de la orden usando recalculateOrderStatus.
 */
export const updateBatteryResult = async (
  batteryId: string,
  status: 'PENDIENTE' | 'APTO' | 'NO_APTO' | 'APTO_CON_OBSERVACIONES',
  expirationDate?: string | null,
  resultDate?: string | null,
  clinicalNotes?: string | null
) => {
  // 1) Traemos la batería + la orden asociada
  const battery = await prisma.orderBattery.findUnique({
    where: { id: batteryId },
    include: { order: true },
  });

  if (!battery) {
    throw new Error('OrderBattery no encontrada');
  }

  const updateData: Prisma.OrderBatteryUpdateInput = {
    status,
    // si viene fecha de resultado, la parseamos; si no, null
    resultDate: resultDate ? new Date(resultDate) : null,
    // REGLA: solo APTO lleva fecha de caducidad, el resto queda null
    expirationDate:
      status === 'APTO' && expirationDate
        ? new Date(expirationDate)
        : null,
    clinicalNotes: clinicalNotes ?? null,
  };

  // 2) Actualizamos la batería
  const updatedBattery = await prisma.orderBattery.update({
    where: { id: batteryId },
    data: updateData,
  });

  // 3) Recalculamos el estado global de la ORDEN
  await recalculateOrderStatus(battery.orderId);

  return updatedBattery;
};
