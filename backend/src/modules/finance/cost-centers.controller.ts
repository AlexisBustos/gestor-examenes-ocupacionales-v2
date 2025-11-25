import { Request, Response } from 'express';
import { findAllCostCenters, createCostCenterDb, deleteCostCenterDb, importCostCentersDb } from './cost-centers.service';

export const getCostCenters = async (req: Request, res: Response) => {
  try {
    const list = await findAllCostCenters();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar centros' });
  }
};

export const createCostCenter = async (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Faltan datos' });
    
    const newCenter = await createCostCenterDb({ code, name });
    res.status(201).json(newCenter);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'El código ya existe' });
    res.status(500).json({ error: 'Error al crear' });
  }
};

export const deleteCostCenter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteCostCenterDb(id);
    res.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// 👇 IMPORTACIÓN
export const importCostCenters = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
    
    const result = await importCostCentersDb(req.file.buffer);
    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en importación', details: error.message });
  }
};