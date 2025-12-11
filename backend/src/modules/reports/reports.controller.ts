import { Request, Response } from 'express';
import { createPrescription, updatePrescription, deletePrescription } from './reports.service';

// 1. Crear Prescripción para Informe TÉCNICO (Cualitativo)
export const addTechnicalPrescription = async (req: Request, res: Response) => {
  try {
    const { technicalReportId } = req.params;
    const result = await createPrescription({ ...req.body, technicalReportId });
    res.status(201).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear prescripción técnica', details: e.message });
  }
};

// 2. Crear Prescripción para Informe CUANTITATIVO
export const addQuantitativePrescription = async (req: Request, res: Response) => {
  try {
    const { quantitativeReportId } = req.params;
    const result = await createPrescription({ ...req.body, quantitativeReportId });
    res.status(201).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear prescripción cuantitativa', details: e.message });
  }
};

// 👇 3. NUEVO: Crear Prescripción para Informe TMERT
export const addTmertPrescription = async (req: Request, res: Response) => {
  try {
    // Obtenemos el ID del TMERT desde la URL (req.params)
    const { tmertReportId } = req.params;
    // Llamamos al servicio pasando el nuevo ID
    const result = await createPrescription({ ...req.body, tmertReportId });
    res.status(201).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear prescripción TMERT', details: e.message });
  }
};

// 4. Actualizar Prescripción (Cualquier tipo)
export const updatePrescriptionItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await updatePrescription(id, req.body);
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Error al actualizar prescripción' }); }
};

// 5. Eliminar Prescripción
export const removePrescription = async (req: Request, res: Response) => {
  try {
    await deletePrescription(req.params.id);
    res.json({ message: 'Prescripción eliminada' });
  } catch (e) { res.status(500).json({ error: 'Error al eliminar' }); }
};