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
    
    // Al usar multer-s3 (uploadS3), el archivo viene aquí. 
    // TypeScript puede quejarse si no usamos 'as any' porque multer-s3 agrega propiedades extra.
    const file = req.file as any; 
    
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

// 👇 FUNCIONES CORREGIDAS (Usando GesService.)
export const deleteQualitative = async (req: Request, res: Response) => {
    try {
        // Usamos GesService para llamar a la función que agregamos en el servicio
        await GesService.removeTechnicalReport(req.params.docId);
        res.json({ message: 'Documento eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar documento' });
    }
};

export const deleteQuantitative = async (req: Request, res: Response) => {
    try {
        // Usamos GesService para llamar a la función que agregamos en el servicio
        await GesService.removeQuantitativeReport(req.params.docId);
        res.json({ message: 'Documento eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar documento' });
    }
};