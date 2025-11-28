import { Request, Response } from 'express';
import { findAllBatteries, createBattery, deleteBattery } from './batteries.service';

export const list = async (req: Request, res: Response) => {
  try { res.json(await findAllBatteries()); } catch (e) { res.status(500).json({ error: 'Error listar' }); }
};

export const create = async (req: Request, res: Response) => {
  try { 
      const { name } = req.body;
      if(!name) return res.status(400).json({error: "Falta nombre"});
      res.json(await createBattery(name)); 
  } catch (e) { res.status(500).json({ error: 'Error crear' }); }
};

export const remove = async (req: Request, res: Response) => {
  try { await deleteBattery(req.params.id); res.json({ message: 'Eliminado' }); } catch (e) { res.status(500).json({ error: 'Error eliminar' }); }
};