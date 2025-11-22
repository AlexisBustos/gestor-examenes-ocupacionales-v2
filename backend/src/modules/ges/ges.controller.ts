import { Request, Response } from 'express';
import { GesService } from './ges.service';
import { createGesSchema, updateGesSchema } from './ges.schema';

export class GesController {
    static async create(req: Request, res: Response) {
        try {
            const data = createGesSchema.parse(req.body);
            const ges = await GesService.create(data);
            res.status(201).json(ges);
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

    static async findAll(req: Request, res: Response) {
        try {
            const areaId = req.query.areaId as string | undefined;
            const gesList = await GesService.findAll(areaId);
            res.json(gesList);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async findById(req: Request, res: Response) {
        try {
            const ges = await GesService.findById(req.params.id);
            res.json(ges);
        } catch (error: any) {
            if (error.message === 'GES not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const data = updateGesSchema.parse(req.body);
            const ges = await GesService.update(req.params.id, data);
            res.json(ges);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (error.message === 'GES not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await GesService.delete(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'GES not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }
}
