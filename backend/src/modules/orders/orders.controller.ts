import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schema';
import { OrderStatus } from '@prisma/client';

export class OrdersController {
    static async create(req: Request, res: Response) {
        try {
            const data = createOrderSchema.parse(req.body);
            const order = await OrdersService.create(data);
            res.status(201).json(order);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (
                error.message === 'Worker not found' ||
                error.message === 'Company not found' ||
                error.message === 'GES not found' ||
                error.message === 'Exam Battery not found'
            ) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async findAll(req: Request, res: Response) {
        try {
            const status = req.query.status as OrderStatus | undefined;
            const orders = await OrdersService.findAll(status);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async findById(req: Request, res: Response) {
        try {
            const order = await OrdersService.findById(req.params.id);
            res.json(order);
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async updateStatus(req: Request, res: Response) {
        try {
            const data = updateOrderStatusSchema.parse(req.body);
            const order = await OrdersService.updateStatus(req.params.id, data);
            res.json(order);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: error.errors });
            } else if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await OrdersService.delete(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Order not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }
}
