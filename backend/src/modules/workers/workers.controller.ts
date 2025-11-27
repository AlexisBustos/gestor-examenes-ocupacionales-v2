import { Request, Response } from 'express';
import { findAllWorkers, importWorkersDb, findWorkerByRut, getWorkerById, updateWorker, deleteWorker } from './workers.service';

export const list = async (req: Request, res: Response) => {
  try {
    const workers = await findAllWorkers();
    res.json(workers);
  } catch (error) { res.status(500).json({ error: 'Error al listar' }); }
};

export const getOne = async (req: Request, res: Response) => {
    try {
      const worker = await getWorkerById(req.params.id);
      if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });
      res.json(worker);
    } catch (error) { res.status(500).json({ error: 'Error al obtener trabajador' }); }
};

export const update = async (req: Request, res: Response) => {
    try {
      const worker = await updateWorker(req.params.id, req.body);
      res.json(worker);
    } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
};

export const remove = async (req: Request, res: Response) => {
    try {
      await deleteWorker(req.params.id);
      res.json({ message: 'Trabajador eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error al eliminar (puede tener órdenes asociadas)' }); }
};

export const checkRut = async (req: Request, res: Response) => {
  try {
    const { rut } = req.params;
    const worker = await findWorkerByRut(rut);
    if (worker) {
        res.json({ exists: true, worker });
    } else {
        res.json({ exists: false });
    }
  } catch (error) { res.status(500).json({ error: 'Error al verificar RUT' }); }
};

export const importWorkers = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Faltan archivo' });
    const result = await importWorkersDb(req.file.buffer);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: 'Error importando', details: error.message }); }
};