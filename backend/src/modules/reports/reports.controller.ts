import { Request, Response } from 'express';
import { createPrescription, deletePrescription, updatePrescriptionStatus, createQuantitativeReport, deleteQuantitativeReport } from './reports.service';

// Prescripciones
export const addPrescription = async (req: Request, res: Response) => {
  try {
    const result = await createPrescription(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear prescripción' });
  }
};

export const removePrescription = async (req: Request, res: Response) => {
  try {
    await deletePrescription(req.params.id);
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// 👇 ACTUALIZADO PARA RECIBIR STATUS
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // El frontend debe enviar { status: 'REALIZADA' }
    const result = await updatePrescriptionStatus(req.params.id, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// Cuantitativos
export const addQuantitative = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const { name, reportDate, technicalReportId } = req.body;
        
        if (!file || !technicalReportId) {
            return res.status(400).json({ error: "Faltan datos o archivo" });
        }

        const result = await createQuantitativeReport({
            technicalReportId,
            name,
            reportDate,
            filename: file.filename
        });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al subir cuantitativo" });
    }
}

export const removeQuantitative = async (req: Request, res: Response) => {
    try {
        await deleteQuantitativeReport(req.params.id);
        res.json({ message: "Eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
}