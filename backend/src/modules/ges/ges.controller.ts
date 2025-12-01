import { Request, Response } from 'express';
import * as GesService from './ges.service';

export const list = async (req: Request, res: Response) => {
  try {
    const { areaId } = req.query;
    const data = await GesService.getAllGes(
      typeof areaId === 'string' ? areaId : undefined,
    );
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar GES' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getGesById(req.params.id);
    if (!data) return res.status(404).json({ error: 'GES no encontrado' });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener GES' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = await GesService.createGes(req.body);
    res.status(201).json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Error al crear GES' });
  }
};

// Endpoint de Sugerencias (Usa la lógica híbrida)
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getSuggestedBatteries(req.params.id);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error sugerencias' });
  }
};

export const getAreaSuggestions = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getBatteriesByArea(req.params.id);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error sugerencias área' });
  }
};

// ACTUALIZAR REGLAS MANUALES
export const updateRules = async (req: Request, res: Response) => {
  try {
    const { batteryIds } = req.body; // Esperamos un array de strings
    if (!Array.isArray(batteryIds)) {
      return res
        .status(400)
        .json({ error: 'Formato inválido: batteryIds debe ser array' });
    }

    const result = await GesService.updateGesBatteries(
      req.params.id,
      batteryIds,
    );
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al guardar reglas' });
  }
};
