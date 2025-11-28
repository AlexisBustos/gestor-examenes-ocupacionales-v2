import { Request, Response } from 'express';
import { findAllWorkCenters, createWorkCenter, deleteWorkCenter } from './work-centers.service';

// 1. Listar (list)
export const list = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const centers = await findAllWorkCenters(companyId as string);
    res.json(centers);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar centros' });
  }
};

// 2. Crear (create)
export const create = async (req: Request, res: Response) => {
  try {
    const center = await createWorkCenter(req.body);
    res.status(201).json(center);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear centro' });
  }
};

// 3. Eliminar (remove)
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteWorkCenter(id);
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};