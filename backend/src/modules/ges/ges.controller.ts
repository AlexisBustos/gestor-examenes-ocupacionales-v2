import { Request, Response } from 'express';
import * as GesService from './ges.service';

export const list = async (req: Request, res: Response) => {
  try {
    const { areaId } = req.query;
    const data = await GesService.getAllGes(areaId as string);
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error al listar GES' }); }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getGesById(req.params.id);
    if (!data) return res.status(404).json({ error: 'GES no encontrado' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error al obtener GES' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = await GesService.createGes(req.body);
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ error: 'Error al crear GES' }); }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getSuggestedBatteries(req.params.id);
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error sugerencias' }); }
};

export const getAreaSuggestions = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getBatteriesByArea(req.params.id);
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error sugerencias área' }); }
};

export const updateRules = async (req: Request, res: Response) => {
    try {
        const { batteryIds } = req.body;
        if (!Array.isArray(batteryIds)) return res.status(400).json({ error: 'Formato inválido' });
        const result = await GesService.updateGesBatteries(req.params.id, batteryIds);
        res.json(result);
    } catch (e) { res.status(500).json({ error: 'Error al guardar reglas' }); }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const docs = await GesService.getGesDocuments(req.params.id);
    res.json(docs);
  } catch (e) { res.status(500).json({ error: 'Error al obtener documentos' }); }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) return res.status(400).json({ error: 'Falta archivo PDF' });
    
    const result = await GesService.uploadGesDocument(id, file, req.body);
    res.json(result);
  } catch (e: any) { 
      console.error(e);
      if (e.message.includes("Evaluación Cualitativa")) {
         return res.status(400).json({ error: e.message });
      }
      res.status(500).json({ error: 'Error al subir documento' }); 
  }
};

// 👇 NUEVO: HISTORIAL COMPLETO
export const getHistory = async (req: Request, res: Response) => {
  try {
    const data = await GesService.getGesFullHistory(req.params.id);
    if (!data) return res.status(404).json({ error: 'GES no encontrado' });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener historia del GES' });
  }
};