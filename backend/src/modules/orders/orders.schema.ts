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

// --- SCHEMA NUEVO PARA RESULTADOS DE BATERÍA ---
export const updateBatteryResultSchema = z.object({
  status: z.enum(['PENDIENTE', 'APTO', 'NO_APTO', 'APTO_CON_OBSERVACIONES']),
  expirationDate: z.string().datetime().optional().nullable(),
  resultDate: z.string().datetime().optional().nullable(),
  clinicalNotes: z.string().max(5000).optional(),
});
