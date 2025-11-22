import { Request, Response } from 'express';
import { WorkCentersService } from './work-centers.service';
import { createWorkCenterSchema, updateWorkCenterSchema } from './work-centers.schema';

export class WorkCentersController {
    static async create(req: Request, res: Response) {
        try {
            const data = createWorkCenterSchema.parse(req.body);
            const workCenter = await WorkCentersService.create(data);
            res.status(201).json(workCenter);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (error.message === 'Company not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async findAll(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string | undefined;
            const workCenters = await WorkCentersService.findAll(companyId);
            res.json(workCenters);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async findById(req: Request, res: Response) {
        try {
            const workCenter = await WorkCentersService.findById(req.params.id);
            res.json(workCenter);
        } catch (error: any) {
            if (error.message === 'WorkCenter not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const data = updateWorkCenterSchema.parse(req.body);
            const workCenter = await WorkCentersService.update(req.params.id, data);
            res.json(workCenter);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (error.message === 'WorkCenter not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await WorkCentersService.delete(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'WorkCenter not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }
}
