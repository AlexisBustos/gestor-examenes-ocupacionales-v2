import { Request, Response } from 'express';
import { getAllGes, getGesById, createGes, uploadGesReport, getSuggestedBatteries, getBatteriesByArea } from './ges.service';

export const list = async (req: Request, res: Response) => {
  try {
    const { areaId } = req.query;
    const gesList = await getAllGes(areaId as string);
    res.json(gesList);
  } catch (error) { res.status(500).json({ error: 'Error al listar GES' }); }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const ges = await getGesById(req.params.id);
    if (!ges) return res.status(404).json({ error: 'GES no encontrado' });
    res.json(ges);
  } catch (error) { res.status(500).json({ error: 'Error al obtener GES' }); }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const suggestions = await getSuggestedBatteries(req.params.id);
    res.json(suggestions);
  } catch (error) { res.status(500).json({ error: 'Error sugerencias GES' }); }
};

// 👇 NUEVO: SUGERENCIAS POR ÁREA
export const getAreaSuggestions = async (req: Request, res: Response) => {
  try {
    const suggestions = await getBatteriesByArea(req.params.id);
    res.json(suggestions);
  } catch (error) { res.status(500).json({ error: 'Error sugerencias Área' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const ges = await createGes(req.body);
    res.status(201).json(ges);
  } catch (error) { res.status(400).json({ error: 'Error al crear GES' }); }
};

export const uploadReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const { reportDate, reportNumber, applyToArea } = req.body;
    if (!file) return res.status(400).json({ error: 'Falta archivo' });

    const result = await uploadGesReport(id, { path: file.path, filename: file.filename }, { reportDate, reportNumber, applyToArea: applyToArea === 'true' });
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: 'Error subir reporte' }); }
};