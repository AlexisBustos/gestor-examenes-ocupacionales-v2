// frontend/src/types/order.types.ts

// Estado global de la orden (coincide con backend)
export type OrderStatus =
  | 'SOLICITADO'
  | 'AGENDADO'
  | 'REALIZADO'
  | 'CERRADO'
  | 'ANULADO';

// Estado clínico/médico de cada batería (coincide con MedicalStatus del backend)
export type MedicalStatus =
  | 'PENDIENTE'
  | 'APTO'
  | 'NO_APTO'
  | 'APTO_CON_OBSERVACIONES';

// Tipo para la batería dentro de una orden (OrderBattery)
export interface OrderBattery {
  id: string;
  status: MedicalStatus;
  expirationDate?: string | null; // ISO string
  resultUrl?: string | null;
  resultDate?: string | null;     // ISO string
  clinicalNotes?: string | null;
  battery: {
    id: string;
    name: string;
    evaluationType?: 'PRE_OCUPACIONAL' | 'OCUPACIONAL' | 'EXAMEN_SALIDA' | null;
  };
}

export interface Worker {
  id: string;
  rut: string;
  name: string;
  position?: string | null;
  phone?: string | null;
}

export interface Company {
  id: string;
  name: string;
}

export interface Ges {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  worker: Worker;
  company: Company;
  ges: Ges;
  orderBatteries?: OrderBattery[];
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  providerName?: string | null;
  externalId?: string | null;
}
