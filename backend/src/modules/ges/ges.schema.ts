import { z } from 'zod';

export const createGesSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    reportDate: z.string().datetime(), // Expecting ISO string
    reportNumber: z.string().min(1, 'Report Number is required'),
    menCount: z.number().int().nonnegative(),
    womenCount: z.number().int().nonnegative(),
    tasksDescription: z.string().min(1, 'Tasks Description is required'),
    validityYears: z.number().int().positive().optional(),
    nextEvaluationDate: z.string().datetime().optional(),
    risksResume: z.string().optional(),
    prescriptions: z.string().optional(),
    areaId: z.string().uuid('Invalid Area ID'),
});

export const updateGesSchema = createGesSchema.partial();
