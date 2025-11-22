import { prisma } from '../../config/prisma';
import { createGesSchema, updateGesSchema } from './ges.schema';
import { z } from 'zod';

type CreateGesDto = z.infer<typeof createGesSchema>;
type UpdateGesDto = z.infer<typeof updateGesSchema>;

export class GesService {
    static async create(data: CreateGesDto) {
        // Verify area exists
        const area = await prisma.area.findUnique({
            where: { id: data.areaId },
        });

        if (!area) {
            throw new Error('Area not found');
        }

        return prisma.ges.create({
            data: {
                ...data,
                reportDate: new Date(data.reportDate),
                nextEvaluationDate: data.nextEvaluationDate ? new Date(data.nextEvaluationDate) : undefined,
            },
        });
    }

    static async findAll(areaId?: string) {
        return prisma.ges.findMany({
            where: areaId ? { areaId } : undefined,
            include: {
                riskExposures: {
                    include: {
                        riskAgent: true,
                    },
                },
                area: {
                    include: {
                        workCenter: {
                            include: {
                                company: true,
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    static async findById(id: string) {
        const ges = await prisma.ges.findUnique({
            where: { id },
            include: {
                riskExposures: {
                    include: {
                        riskAgent: true,
                    },
                },
                workers: true,
                area: {
                    include: {
                        workCenter: {
                            include: {
                                company: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ges) {
            throw new Error('GES not found');
        }

        return ges;
    }

    static async update(id: string, data: UpdateGesDto) {
        await this.findById(id);
        return prisma.ges.update({
            where: { id },
            data: {
                ...data,
                reportDate: data.reportDate ? new Date(data.reportDate) : undefined,
                nextEvaluationDate: data.nextEvaluationDate ? new Date(data.nextEvaluationDate) : undefined,
            },
        });
    }

    static async delete(id: string) {
        await this.findById(id);
        return prisma.ges.delete({
            where: { id },
        });
    }
}
