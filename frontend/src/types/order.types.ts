// frontend/src/types/order.types.ts

// Definimos los estados posibles como un tipo String Union
export type OrderStatus = 'SOLICITADO' | 'AGENDADO' | 'REALIZADO' | 'CERRADO' | 'ANULADO';

export interface Worker {
  id: string;
  rut: string;
  name: string;
  position: string;
  managementArea: string | null;
}

export interface Company {
  id: string;
  name: string;
}

export interface ExamBattery {
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
  examBattery: ExamBattery;
  ges: Ges;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  providerName?: string | null;
  externalId?: string | null;
}