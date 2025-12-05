import { Request, Response } from 'express';
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  updateBatteryResult,
  getWorkerOrderSuggestions
} from './orders.service';

// 👇 ESTA ES LA LÍNEA NUEVA (Para poder crear/buscar trabajadores)
import { createWorkerDb } from '../workers/workers.service';

// --- LISTAR ÓRDENES (INTACTO) ---
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders(req.query.status as string);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

// --- SUGERENCIAS (INTACTO) ---
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

// --- CREAR ORDEN (ESTO ES LO ÚNICO QUE CAMBIÓ) ---
export const create = async (req: Request, res: Response) => {
  try {
    // 1. Recibimos los datos del formulario
    const { worker, gesId, companyId, evaluationType, examBatteries } = req.body;

    // 2. NUEVO: Creamos o buscamos al trabajador PRIMERO
    // Al pasarle 'evaluationType', el servicio sabrá si ponerlo en 'TRANSITO' o 'NOMINA'
    const savedWorker = await createWorkerDb({
        ...worker,
        companyId,
        evaluationType // <--- Este es el dato clave para el semáforo
    });

    // 3. Preparamos los datos para guardar la orden vinculada a ese trabajador
    const orderData = {
        evaluationType,
        status: 'SOLICITADO',
        // Conectamos con el ID real del trabajador (sea nuevo o antiguo)
        worker: { connect: { id: savedWorker.id } },
        company: { connect: { id: companyId } },
        ges: { connect: { id: gesId } },
        // Creamos la lista de baterías
        orderBatteries: {
            create: examBatteries.map((bat: any) => ({
                batteryId: bat.id,
                status: 'PENDIENTE'
            }))
        }
    };

    // 4. Guardamos la orden
    const order = await createOrder(orderData);
    
    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error al crear orden:", error);
    // Devolvemos el mensaje de error para saber qué pasó si falla
    res.status(400).json({ error: 'Error al crear la orden: ' + error.message });
  }
};

// --- ACTUALIZAR ESTADO (INTACTO) ---
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

// --- GUARDAR RESULTADO DE BATERÍA (INTACTO) ---
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