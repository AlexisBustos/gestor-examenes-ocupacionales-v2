import { prisma } from '../../config/prisma';
import { createWorkCenterSchema, updateWorkCenterSchema } from './work-centers.schema';
import { z } from 'zod';

type CreateWorkCenterDto = z.infer<typeof createWorkCenterSchema>;
type UpdateWorkCenterDto = z.infer<typeof updateWorkCenterSchema>;

export class WorkCentersService {
    static async create(data: CreateWorkCenterDto) {
        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: data.companyId },
        });

        if (!company) {
            throw new Error('Company not found');
        }

        return prisma.workCenter.create({
            data,
        });
    }

    static async findAll(companyId?: string) {
        return prisma.workCenter.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: { name: 'asc' },
            include: { company: true },
        });
    }

    static async findById(id: string) {
        const workCenter = await prisma.workCenter.findUnique({
            where: { id },
            include: { company: true },
        });

        if (!workCenter) {
            throw new Error('WorkCenter not found');
        }

        return workCenter;
    }

    static async update(id: string, data: UpdateWorkCenterDto) {
        await this.findById(id);
        return prisma.workCenter.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        return prisma.workCenter.delete({
            where: { id },
        });
    }
}
