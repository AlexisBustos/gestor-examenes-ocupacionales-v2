import { Request, Response } from 'express';
import { importRulesDb, getRulesDb, createRuleDb, deleteRuleDb, getAllBatteriesDb } from './config.service';

export const getRules = async (req: Request, res: Response) => {
    try { res.json(await getRulesDb()); } catch (e) { res.status(500).json({ error: 'Error obteniendo reglas' }); }
};

export const createRule = async (req: Request, res: Response) => {
    try { res.json(await createRuleDb(req.body)); } catch (e) { res.status(500).json({ error: 'Error creando regla' }); }
};

export const deleteRule = async (req: Request, res: Response) => {
    try { await deleteRuleDb(req.params.id); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({ error: 'Error eliminando' }); }
};

export const getBatteries = async (req: Request, res: Response) => {
    try { res.json(await getAllBatteriesDb()); } catch (e) { res.status(500).json({ error: 'Error obteniendo baterías' }); }
};

export const importRules = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
    const result = await importRulesDb(req.file.buffer);
    res.json(result);
  } catch (e: any) { 
      console.error(e);
      res.status(500).json({ error: 'Error importando reglas', details: e.message }); 
  }
};