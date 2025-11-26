import { Request, Response } from 'express';
import { getAllGes, getGesById, createGes, uploadGesReport, getSuggestedBatteries } from './ges.service';

export const list = async (req: Request, res: Response) => {
  try {
    // 👇 AQUÍ CAPTURAMOS EL FILTRO
    const { areaId } = req.query;
    const gesList = await getAllGes(areaId as string);
    res.json(gesList);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar GES' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ges = await getGesById(id);
    if (!ges) return res.status(404).json({ error: 'GES no encontrado' });
    res.json(ges);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener GES' });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suggestions = await getSuggestedBatteries(id);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo sugerencias' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const ges = await createGes(req.body);
    res.status(201).json(ges);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear GES' });
  }
};

export const uploadReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const { reportDate, reportNumber, applyToArea } = req.body;

    if (!file) return res.status(400).json({ error: 'No se subió ningún archivo PDF' });
    if (!reportDate || !reportNumber) return res.status(400).json({ error: 'Faltan datos del informe' });

    const shouldApplyToArea = applyToArea === 'true';
    const result = await uploadGesReport(id, { path: file.path, filename: file.filename }, { reportDate, reportNumber, applyToArea: shouldApplyToArea });

    res.json(result);
  } catch (error: any) {
    console.error("Error subiendo reporte:", error);
    res.status(500).json({ error: 'Error al subir informe', details: error.message });
  }
};