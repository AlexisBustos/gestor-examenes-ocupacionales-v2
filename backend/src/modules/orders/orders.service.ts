import { prisma } from '../../config/prisma';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schema';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

type CreateOrderDto = z.infer<typeof createOrderSchema>;
type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

export class OrdersService {
    static async create(data: CreateOrderDto) {
        // Verify all related entities exist
        const [worker, company, ges, examBattery] = await Promise.all([
            prisma.worker.findUnique({ where: { id: data.workerId } }),
            prisma.company.findUnique({ where: { id: data.companyId } }),
            prisma.ges.findUnique({ where: { id: data.gesId } }),
            prisma.examBattery.findUnique({ where: { id: data.examBatteryId } }),
        ]);

        if (!worker) throw new Error('Worker not found');
        if (!company) throw new Error('Company not found');
        if (!ges) throw new Error('GES not found');
        if (!examBattery) throw new Error('Exam Battery not found');

        return prisma.examOrder.create({
            data: {
                ...data,
                status: OrderStatus.SOLICITADO,
            },
            include: {
                worker: true,
                company: true,
                ges: true,
                examBattery: true,
            },
        });
    }

    static async findAll(status?: OrderStatus) {
        return prisma.examOrder.findMany({
            where: status ? { status } : undefined,
            include: {
                worker: true,
                company: true,
                examBattery: true,
                ges: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async findById(id: string) {
        const order = await prisma.examOrder.findUnique({
            where: { id },
            include: {
                worker: true,
                company: true,
                examBattery: true,
                ges: true,
            },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    }

    static async updateStatus(id: string, data: UpdateOrderStatusDto) {
        await this.findById(id);

        return prisma.examOrder.update({
            where: { id },
            data: {
                status: data.status as OrderStatus,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
                providerName: data.providerName,
                externalId: data.externalId,
            },
            include: {
                worker: true,
                company: true,
                examBattery: true,
                ges: true,
            },
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        return prisma.examOrder.delete({
            where: { id },
        });
    }
}
