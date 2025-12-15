import { Request, Response } from 'express';
// 👇 CORRECCIÓN: Ahora importamos desde './analytics.service' (sin typo)
import { getSurveillanceData, getCostCenterAnalytics, getDashboardStats } from './analytics.service';

// 1. Controlador de Vigilancia
export const getSurveillance = async (req: Request, res: Response) => {
  try {
    const data = await getSurveillanceData();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vigilancia médica' });
  }
};

// 2. Controlador de Centros de Costos
export const getCostCenters = async (req: Request, res: Response) => {
  try {
    const data = await getCostCenterAnalytics();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener análisis de costos' });
  }
};

// 3. Controlador del Dashboard
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const data = await getDashboardStats(companyId);
        res.json(data);
    } catch (error) {
        console.error("❌ Error en Dashboard Controller:", error);
        res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
    }
};