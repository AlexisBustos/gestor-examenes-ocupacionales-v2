import { prisma } from '../../config/prisma';
import { createAreaSchema, updateAreaSchema } from './areas.schema';
import { z } from 'zod';

type CreateAreaDto = z.infer<typeof createAreaSchema>;
type UpdateAreaDto = z.infer<typeof updateAreaSchema>;

export class AreasService {
    static async create(data: CreateAreaDto) {
        // Verify workCenter exists
        const workCenter = await prisma.workCenter.findUnique({
            where: { id: data.workCenterId },
        });

        if (!workCenter) {
            throw new Error('WorkCenter not found');
        }

        return prisma.area.create({
            data,
        });
    }

    static async findAll(workCenterId?: string) {
        return prisma.area.findMany({
            where: workCenterId ? { workCenterId } : undefined,
            orderBy: { name: 'asc' },
            include: { workCenter: true },
        });
    }

    static async findById(id: string) {
        const area = await prisma.area.findUnique({
            where: { id },
            include: { workCenter: true },
        });

        if (!area) {
            throw new Error('Area not found');
        }

        return area;
    }

    static async update(id: string, data: UpdateAreaDto) {
        await this.findById(id);
        return prisma.area.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        return prisma.area.delete({
            where: { id },
        });
    }
}
