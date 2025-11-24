import { Request, Response } from 'express';
import * as ReportsService from './reports.service';
import path from 'path';

export const uploadReport = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        const { reportNumber, reportDate } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const pdfUrl = `/uploads/${file.filename}`;

        const report = await ReportsService.createReport({
            reportNumber,
            reportDate: new Date(reportDate),
            pdfUrl,
            companyId,
        });

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading report' });
    }
};

export const getCompanyReports = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        const reports = await ReportsService.getReportsByCompany(companyId);
        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching reports' });
    }
};

export const linkReport = async (req: Request, res: Response) => {
    try {
        const { gesId } = req.params;
        const { technicalReportId, applyToArea } = req.body;

        if (applyToArea) {
            // We need to find the areaId for this GES first to apply to all
            // For now, let's assume the frontend sends areaId or we fetch the GES first.
            // To keep it simple and robust, let's fetch the GES to get the areaId
            const prisma = require('../../lib/prisma').default; // Lazy load to avoid circular deps if any
            const ges = await prisma.ges.findUnique({ where: { id: gesId } });
            if (!ges) return res.status(404).json({ error: 'GES not found' });

            await ReportsService.linkReportToArea(ges.areaId, technicalReportId);
            res.json({ message: 'Report linked to all GES in area' });
        } else {
            const updatedGes = await ReportsService.linkReportToGes(gesId, technicalReportId);
            res.json(updatedGes);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error linking report' });
    }
};
