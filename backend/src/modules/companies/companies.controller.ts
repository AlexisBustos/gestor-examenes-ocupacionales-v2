import { Request, Response } from 'express';
import { CompaniesService } from './companies.service';
import { createCompanySchema, updateCompanySchema } from './companies.schema';

export class CompaniesController {
    static async create(req: Request, res: Response) {
        try {
            const data = createCompanySchema.parse(req.body);
            const company = await CompaniesService.create(data);
            res.status(201).json(company);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (error.message === 'Company with this RUT already exists') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async findAll(req: Request, res: Response) {
        try {
            const companies = await CompaniesService.findAll();
            res.json(companies);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async findById(req: Request, res: Response) {
        try {
            const company = await CompaniesService.findById(req.params.id);
            res.json(company);
        } catch (error: any) {
            if (error.message === 'Company not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const data = updateCompanySchema.parse(req.body);
            const company = await CompaniesService.update(req.params.id, data);
            res.json(company);
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

    static async delete(req: Request, res: Response) {
        try {
            await CompaniesService.delete(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Company not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }
}
