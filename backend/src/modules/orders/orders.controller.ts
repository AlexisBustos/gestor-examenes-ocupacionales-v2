import { Request, Response } from 'express';
import { createOrder, getAllOrders, updateOrderStatus } from './orders.service';

// 1. Obtener todas las órdenes
export const getOrders = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const orders = await getAllOrders(status);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

// 2. Crear nueva orden
export const create = async (req: Request, res: Response) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al crear la orden' });
  }
};

// 3. Actualizar estado (Agendar)
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Aquí recibimos los datos extra del agendamiento
    const { status, scheduledAt, providerName, externalId } = req.body;
    
    const order = await updateOrderStatus(id, status, scheduledAt, providerName, externalId);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
};

// 4. Eliminar (Placeholder para evitar error de ruta)
export const remove = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ message: "Orden eliminada (Simulado)" });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};