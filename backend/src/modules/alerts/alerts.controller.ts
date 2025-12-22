import { Request, Response } from 'express';
import { getSystemAlerts } from './alerts.service';

export const getDashboardAlerts = async (req: Request, res: Response) => {
    try {
        const data = await getSystemAlerts();
        res.json(data);
    } catch (error) {
        console.error("Error en motor de alertas:", error);
        res.status(500).json({ error: 'Error calculando vencimientos' });
    }
};