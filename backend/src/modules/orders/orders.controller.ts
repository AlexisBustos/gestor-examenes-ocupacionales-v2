import { Request, Response } from 'express';
import { createOrder, getAllOrders, updateOrderStatus, updateBatteryResult } from './orders.service';

// 1. Listar
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders(req.query.status as string);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

// 2. Crear (Con soporte para lista de baterías explícita)
export const create = async (req: Request, res: Response) => {
  try {
    // Desestructuramos lo que viene del frontend
    const { worker, gesId, companyId, evaluationType, examBatteries } = req.body;

    const order = await createOrder({
        worker,
        gesId,
        companyId,
        evaluationType,
        examBatteries // Ahora el servicio sí lo espera
    });
    
    res.status(201).json(order);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: 'Error al crear la orden' });
  }
};

// 3. Actualizar Estado
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, scheduledAt, providerName, externalId } = req.body;
    const order = await updateOrderStatus(req.params.id, status, scheduledAt, providerName, externalId);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// 4. Guardar Resultados
export const setResult = async (req: Request, res: Response) => {
    try {
        const { status, expirationDate } = req.body;
        const result = await updateBatteryResult(req.params.batteryId, status, expirationDate);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar resultado' });
    }
}