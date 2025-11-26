import { Request, Response } from 'express';
import { findAllRisks, addProtocolDb, removeProtocolDb } from './risks.service';

export const list = async (req: Request, res: Response) => {
  try {
    const risks = await findAllRisks();
    res.json(risks);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar riesgos' });
  }
};

export const addProtocol = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    const result = await addProtocolDb(id, file.filename, file.originalname);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir protocolo' });
  }
};

export const removeProtocol = async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    await removeProtocolDb(protocolId);
    res.json({ message: 'Protocolo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar protocolo' });
  }
};