import { Request, Response } from 'express';
import { findAllRisks, uploadProtocolDb } from './risks.service';

export const list = async (req: Request, res: Response) => {
  try {
    const risks = await findAllRisks();
    res.json(risks);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar riesgos' });
  }
};

export const uploadProtocol = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Guardamos la ruta relativa
    const result = await uploadProtocolDb(id, file.filename);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir protocolo' });
  }
};