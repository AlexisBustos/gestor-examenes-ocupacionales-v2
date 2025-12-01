import { Request, Response } from 'express';
import { createOrder, getAllOrders, updateOrderStatus, updateBatteryResult, getWorkerOrderSuggestions } from './orders.service';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders(req.query.status as string);
    res.json(orders);
  } catch (error) { res.status(500).json({ error: 'Error al obtener órdenes' }); }
};

// 👇 NUEVO ENDPOINT DE SUGERENCIAS
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { workerId, gesId } = req.query;
    if (!gesId) return res.status(400).json({ error: 'GES ID es requerido' });
    
    // workerId puede ser undefined (si es trabajador nuevo)
    const suggestions = await getWorkerOrderSuggestions(workerId as string, gesId as string);
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando sugerencias' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { worker, gesId, companyId, evaluationType, examBatteries } = req.body;
    const order = await createOrder({ worker, gesId, companyId, evaluationType, examBatteries });
    res.status(201).json(order);
  } catch (error: any) { res.status(400).json({ error: 'Error al crear la orden' }); }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, scheduledAt, providerName, externalId } = req.body;
    const order = await updateOrderStatus(req.params.id, status, scheduledAt, providerName, externalId);
    res.json(order);
  } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
};

export const setResult = async (req: Request, res: Response) => {
    try {
        const { status, expirationDate } = req.body;
        const result = await updateBatteryResult(req.params.batteryId, status, expirationDate);
        res.json(result);
    } catch (error) { res.status(500).json({ error: 'Error al guardar resultado' }); }
}