import { Request, Response } from 'express';
import { getAllAreas, createArea, updateArea } from './areas.service';

export const list = async (req: Request, res: Response) => {
  try {
    const { workCenterId } = req.query;
    const areas = await getAllAreas(workCenterId as string);
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar áreas' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const area = await createArea(req.body);
    res.status(201).json(area);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear área' });
  }
};

// Función para actualizar (Asignar CC)
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const area = await updateArea(id, req.body);
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar área' });
  }
};