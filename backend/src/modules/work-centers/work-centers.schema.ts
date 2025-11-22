import { z } from 'zod';

export const createWorkCenterSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().optional(),
    companyId: z.string().uuid('Invalid company ID'),
});

export const updateWorkCenterSchema = createWorkCenterSchema.partial();
