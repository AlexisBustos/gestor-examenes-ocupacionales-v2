import { Request, Response } from 'express';
import { createOrder, getAllOrders, updateOrderStatus, updateBatteryResult } from './orders.service';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders(req.query.status as string);
    res.json(orders);
  } catch (error) { res.status(500).json({ error: 'Error al obtener órdenes' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error) { res.status(400).json({ error: 'Error al crear' }); }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, scheduledAt, providerName, externalId } = req.body;
    const order = await updateOrderStatus(req.params.id, status, scheduledAt, providerName, externalId);
    res.json(order);
  } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
};

// NUEVO: GUARDAR RESULTADO
export const setResult = async (req: Request, res: Response) => {
    try {
        const { status, expirationDate } = req.body;
        const result = await updateBatteryResult(req.params.batteryId, status, expirationDate);
        res.json(result);
    } catch (error) { res.status(500).json({ error: 'Error al guardar resultado' }); }
}