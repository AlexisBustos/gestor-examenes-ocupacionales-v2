import axios from '@/lib/axios';
import type { Order } from '@/types/order.types';

// --- FUNCIONES INDIVIDUALES ---

export const getOrders = async (): Promise<Order[]> => {
  const { data } = await axios.get('/orders');
  return data;
};

export const createOrder = async (orderData: any) => {
  const { data } = await axios.post('/orders', orderData);
  return data;
};

export const updateOrderStatus = async (
  id: string, 
  status: string, 
  scheduledAt?: string, 
  providerName?: string,
  externalId?: string
) => {
  const { data } = await axios.patch(`/orders/${id}/status`, {
    status,
    scheduledAt,
    providerName,
    externalId
  });
  return data;
};

// --- EL PARCHE MÁGICO (Retro-compatibilidad) ---
// Esto agrupa las funciones en un objeto para que los archivos viejos no fallen
export const ordersService = {
  getOrders,
  createOrder,
  updateOrderStatus
};