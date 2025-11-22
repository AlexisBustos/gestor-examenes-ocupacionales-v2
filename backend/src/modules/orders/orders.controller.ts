import { Request, Response } from 'express';
import { createOrder, getAllOrders, updateOrderStatus } from './orders.service';

// Obtener todas las órdenes
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

// Crear nueva orden
export const create = async (req: Request, res: Response) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al crear la orden' });
  }
};

// Actualizar estado
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, scheduledAt } = req.body;
    const order = await updateOrderStatus(id, status, scheduledAt);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la orden' });
  }
};

// Eliminar (Opcional, por si la ruta lo pide)
export const remove = async (req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented yet" });
}