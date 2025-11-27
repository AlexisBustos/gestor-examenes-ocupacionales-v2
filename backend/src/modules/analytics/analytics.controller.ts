import { Request, Response } from 'express';
import { getSurveillanceData } from './analytics.service';

export const getSurveillance = async (req: Request, res: Response) => {
  try {
    const data = await getSurveillanceData();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vigilancia médica' });
  }
};