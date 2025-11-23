import { Request, Response } from 'express';
import { processExcel } from './import.service';

export const uploadStructure = async (req: Request, res: Response) => {
  try {
    // 1. Validar que venga un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    // 2. Procesar el Excel
    const result = await processExcel(req.file.buffer);

    // 3. Devolver la respuesta (El error estaba aquí, ahora solo devolvemos result)
    res.json(result);

  } catch (error: any) {
    console.error("Error en importación:", error);
    res.status(500).json({ 
      error: 'Error al procesar el archivo', 
      details: error.message 
    });
  }
};