import { Request, Response } from 'express';
import { findAllWorkers, importWorkersDb, findWorkerByRut, getWorkerById, updateWorker, deleteWorker, analyzeJobChange, transferWorker } from './workers.service';

export const list = async (req: Request, res: Response) => {
  try { res.json(await findAllWorkers()); } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const getOne = async (req: Request, res: Response) => {
    try {
      const worker = await getWorkerById(req.params.id);
      if (!worker) return res.status(404).json({ error: 'No encontrado' });
      res.json(worker);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const update = async (req: Request, res: Response) => {
    try { res.json(await updateWorker(req.params.id, req.body)); } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const remove = async (req: Request, res: Response) => {
    try { await deleteWorker(req.params.id); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const checkRut = async (req: Request, res: Response) => {
  try {
    const worker = await findWorkerByRut(req.params.rut);
    res.json(worker ? { exists: true, worker } : { exists: false });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const importWorkers = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
    res.json(await importWorkersDb(req.file.buffer));
  } catch (e: any) { res.status(500).json({ error: 'Error' }); }
};

// 👇 AQUÍ ESTÁ LA FUNCIÓN QUE DABA 404. AHORA TIENE LOGS.
export const analyzeTransfer = async (req: Request, res: Response) => {
  console.log("📡 [BACKEND] Petición recibida en analyzeTransfer");
  try {
    const { workerId, targetGesId } = req.body;
    const result = await analyzeJobChange(workerId, targetGesId);
    res.json(result);
  } catch (e) { 
    console.error(e);
    res.status(500).json({ error: 'Error analizando' }); 
  }
};

export const executeTransfer = async (req: Request, res: Response) => {
  try {
    const { workerId, targetGesId } = req.body;
    res.json(await transferWorker(workerId, targetGesId));
  } catch (e) { res.status(500).json({ error: 'Error mover' }); }
};