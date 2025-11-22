import { z } from 'zod';

export const createCompanySchema = z.object({
    rut: z.string().min(1, 'RUT is required'),
    name: z.string().min(1, 'Name is required'),
    contactEmail: z.string().email('Invalid email format'),
    address: z.string().optional(),
    phone: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();
