import { Request, Response } from 'express';
import { findAllRisks, addProtocolDb, removeProtocolDb } from './risks.service';

// GET: Listar todos los riesgos
export const getRisks = async (req: Request, res: Response) => {
  try {
    const risks = await findAllRisks();
    res.json(risks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar riesgos' });
  }
};

// POST: Subir Protocolo
export const addProtocol = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Al usar multer-s3, el archivo viene con la propiedad .location
    const file = req.file as any; 
    
    if (!file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Guardamos la URL de S3 (file.location) en la BD
    const result = await addProtocolDb(id, file.location, file.originalname);
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir protocolo' });
  }
};

// DELETE: Eliminar Protocolo
export const removeProtocol = async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    await removeProtocolDb(protocolId);
    res.json({ message: 'Protocolo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar protocolo' });
  }
};