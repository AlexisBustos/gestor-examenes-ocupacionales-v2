import { Request, Response } from 'express';
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  updateBatteryResult,
  getWorkerOrderSuggestions,
  getOrderById // <--- Importante: Importamos esto del servicio
} from './orders.service';

// Importamos para crear trabajador si no existe
import { createWorkerDb } from '../workers/workers.service';

// --- LISTAR ÓRDENES ---
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders(req.query.status as string);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

// --- OBTENER UNA ORDEN POR ID (ESTA ES LA QUE FALTABA) ---
export const getOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await getOrderById(id);
  
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
  
      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la orden' });
    }
};

// --- SUGERENCIAS ---
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { workerId, gesId } = req.query;
    if (!gesId) return res.status(400).json({ error: 'GES ID es requerido' });

    const suggestions = await getWorkerOrderSuggestions(workerId as string, gesId as string);
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calculando sugerencias' });
  }
};

// --- CREAR ORDEN ---
export const create = async (req: Request, res: Response) => {
  try {
    const { worker, gesId, companyId, evaluationType, examBatteries } = req.body;

    // Creamos o buscamos al trabajador
    const savedWorker = await createWorkerDb({
        ...worker,
        companyId,
        evaluationType
    });

    // Datos de la orden
    const orderData = {
        evaluationType,
        status: 'SOLICITADO',
        worker: { connect: { id: savedWorker.id } },
        company: { connect: { id: companyId } },
        ges: { connect: { id: gesId } },
        orderBatteries: {
            create: examBatteries.map((bat: any) => ({
                batteryId: bat.id,
                status: 'PENDIENTE'
            }))
        }
    };

    const order = await createOrder(orderData);
    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error al crear orden:", error);
    res.status(400).json({ error: 'Error al crear la orden: ' + error.message });
  }
};

// --- ACTUALIZAR ESTADO ---
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, scheduledAt, providerName, externalId } = req.body;
    const order = await updateOrderStatus(req.params.id, status, scheduledAt, providerName, externalId);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// --- GUARDAR RESULTADO DE BATERÍA ---
export const setResult = async (req: Request, res: Response) => {
  try {
    const { status, expirationDate, resultDate, clinicalNotes } = req.body;
    const result = await updateBatteryResult(
      req.params.batteryId,
      status,
      expirationDate,
      resultDate,
      clinicalNotes
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar resultado' });
  }
};