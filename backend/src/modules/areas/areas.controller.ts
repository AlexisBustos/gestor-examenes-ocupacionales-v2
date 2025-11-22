import { Request, Response } from 'express';
import { AreasService } from './areas.service';
import { createAreaSchema, updateAreaSchema } from './areas.schema';

export class AreasController {
    static async create(req: Request, res: Response) {
        try {
            const data = createAreaSchema.parse(req.body);
            const area = await AreasService.create(data);
            res.status(201).json(area);
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

    static async findAll(req: Request, res: Response) {
        try {
            const workCenterId = req.query.workCenterId as string | undefined;
            const areas = await AreasService.findAll(workCenterId);
            res.json(areas);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async findById(req: Request, res: Response) {
        try {
            const area = await AreasService.findById(req.params.id);
            res.json(area);
        } catch (error: any) {
            if (error.message === 'Area not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const data = updateAreaSchema.parse(req.body);
            const area = await AreasService.update(req.params.id, data);
            res.json(area);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (error.message === 'Area not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await AreasService.delete(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Area not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }
}
