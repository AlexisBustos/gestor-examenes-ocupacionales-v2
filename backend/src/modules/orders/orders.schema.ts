import { z } from 'zod';

export const createOrderSchema = z.object({
    workerId: z.string().uuid('Invalid worker ID'),
    companyId: z.string().uuid('Invalid company ID'),
    gesId: z.string().uuid('Invalid GES ID'),
    examBatteryId: z.string().uuid('Invalid exam battery ID'),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['SOLICITADO', 'AGENDADO', 'REALIZADO', 'CERRADO', 'ANULADO']),
    scheduledAt: z.string().datetime().optional(),
    providerName: z.string().optional(),
    externalId: z.string().optional(),
});
