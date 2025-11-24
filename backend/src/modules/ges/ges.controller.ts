import { Request, Response } from 'express';
import { getAllGes, getGesById, createGes, uploadGesReport } from './ges.service';

export const list = async (req: Request, res: Response) => {
  try {
    const gesList = await getAllGes();
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

export const create = async (req: Request, res: Response) => {
  try {
    const ges = await createGes(req.body);
    res.status(201).json(ges);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear GES' });
  }
};

// CONTROLADOR DE SUBIDA (CORREGIDO)
export const uploadReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    // Aquí recibimos los datos del formulario
    const { reportDate, reportNumber, applyToArea } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo PDF' });
    }

    if (!reportDate || !reportNumber) {
      return res.status(400).json({ error: 'Faltan datos del informe (Fecha o Número)' });
    }

    // CONVERSIÓN CRÍTICA: FormData envía "true" (string), lo pasamos a boolean
    const shouldApplyToArea = applyToArea === 'true';

    const result = await uploadGesReport(
      id, 
      { path: file.path, filename: file.filename }, 
      { 
        reportDate, 
        reportNumber, 
        applyToArea: shouldApplyToArea // <--- Pasamos la bandera correcta
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error subiendo reporte:", error);
    res.status(500).json({ error: 'Error al subir informe', details: error.message });
  }
};