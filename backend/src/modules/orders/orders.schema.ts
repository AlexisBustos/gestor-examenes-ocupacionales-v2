import { z } from 'zod';

export const createOrderSchema = z.object({
    worker: z.object({
        rut: z.string(),
        name: z.string(),
        phone: z.string().optional(),
        position: z.string().optional(),
    }),
    companyId: z.string().uuid('Invalid company ID'),
    gesId: z.string().uuid('Invalid GES ID'),
    examBatteryId: z.string().uuid('Invalid exam battery ID').optional(),
    evaluationType: z.enum(['PRE_OCUPACIONAL', 'OCUPACIONAL', 'EXAMEN_SALIDA']).optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['SOLICITADO', 'AGENDADO', 'REALIZADO', 'CERRADO', 'ANULADO']),
    scheduledAt: z.string().datetime().optional(),
    providerName: z.string().optional(),
    externalId: z.string().optional(),
});
