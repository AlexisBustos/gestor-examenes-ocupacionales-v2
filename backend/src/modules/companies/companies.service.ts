import { prisma } from '../../config/prisma';
import { createCompanySchema, updateCompanySchema } from './companies.schema';
import { z } from 'zod';

type CreateCompanyDto = z.infer<typeof createCompanySchema>;
type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

export class CompaniesService {
    static async create(data: CreateCompanyDto) {
        const existingCompany = await prisma.company.findUnique({
            where: { rut: data.rut },
        });

        if (existingCompany) {
            throw new Error('Company with this RUT already exists');
        }

        return prisma.company.create({
            data,
        });
    }

    static async findAll() {
        return prisma.company.findMany({
            orderBy: { name: 'asc' },
        });
    }

    static async findById(id: string) {
        const company = await prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            throw new Error('Company not found');
        }

        return company;
    }

    static async update(id: string, data: UpdateCompanyDto) {
        // Verifica si existe
        await this.findById(id);

        return prisma.company.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string) {
        // Verifica si existe
        await this.findById(id);

        return prisma.company.delete({
            where: { id },
        });
    }
}
