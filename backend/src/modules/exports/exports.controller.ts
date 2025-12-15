import { Request, Response } from 'express';
import { generateSurveillanceReport, generateHeadcountReport } from './exports.service';

export const downloadSurveillance = async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const buffer = await generateSurveillanceReport(companyId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Vigilancia_Medica_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        res.send(buffer);
    } catch (error) {
        console.error("Error generando reporte vigilancia:", error);
        res.status(500).json({ error: "Error al generar reporte" });
    }
};

export const downloadHeadcount = async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const buffer = await generateHeadcountReport(companyId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Dotacion_Riesgos_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        res.send(buffer);
    } catch (error) {
        console.error("Error generando reporte dotación:", error);
        res.status(500).json({ error: "Error al generar reporte" });
    }
};