// frontend/src/services/orders.service.ts

import axios from '@/lib/axios';
import type { Order, MedicalStatus, OrderBattery } from '@/types/order.types';

// Obtener lista de órdenes
export const getOrders = async (status?: string): Promise<Order[]> => {
  const params = status ? { status } : {};
  const { data } = await axios.get<Order[]>('/orders', { params });
  return data;
};

// Actualizar estado general de la orden
export const updateOrderStatus = async (
  id: string,
  newStatus: string,
  scheduledAt?: string,
  providerName?: string,
  externalId?: string
) => {
  const { data } = await axios.patch(`/orders/${id}/status`, {
    status: newStatus,
    scheduledAt,
    providerName,
    externalId,
  });
  return data;
};

// Actualizar resultado de una batería específica
export const updateOrderBatteryResult = async (
  batteryId: string,
  payload: {
    status: MedicalStatus;
    resultDate?: string | null;
    expirationDate?: string | null;
    clinicalNotes?: string | null;
  }
): Promise<OrderBattery> => {
  const { data } = await axios.patch(`/orders/battery/${batteryId}/result`, payload);
  return data;
};

// 🔁 COMPATIBILIDAD: objeto agrupado para hooks/lugares que usan `ordersService`
export const ordersService = {
  getOrders,
  updateOrderStatus,
  updateOrderBatteryResult,
};
