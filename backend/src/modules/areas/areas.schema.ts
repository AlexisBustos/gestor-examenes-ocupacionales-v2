import { z } from 'zod';

export const createAreaSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    workCenterId: z.string().uuid('Invalid workCenter ID'),
});

export const updateAreaSchema = createAreaSchema.partial();
