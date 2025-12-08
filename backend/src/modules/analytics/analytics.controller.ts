import { Request, Response } from 'express';
// 👇 IMPORTANTE: Agregamos la nueva función 'getCostCenterAnalytics' al import
import { getSurveillanceData, getCostCenterAnalytics } from './analytics.service';

// 1. Controlador de Vigilancia (Lo que ya tenías)
export const getSurveillance = async (req: Request, res: Response) => {
  try {
    const data = await getSurveillanceData();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vigilancia médica' });
  }
};

// 👇 2. NUEVO: Controlador de Centros de Costos
export const getCostCenters = async (req: Request, res: Response) => {
  try {
    const data = await getCostCenterAnalytics();
    res.json(data);
  } catch (error) {
    console.error(error); // Log del error en consola para depurar
    res.status(500).json({ error: 'Error al obtener análisis de costos' });
  }
};