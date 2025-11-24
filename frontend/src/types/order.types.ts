export type OrderStatus = 'SOLICITADO' | 'AGENDADO' | 'REALIZADO' | 'CERRADO' | 'ANULADO';

export interface RiskAgent {
  id: string;
  name: string;
}

export interface RiskExposure {
  id: string;
  riskAgent: RiskAgent;
  exposureType?: string;
}

export interface Ges {
  id: string;
  name: string;
  riskExposures?: RiskExposure[];
  prescriptions?: string;
}

export interface ExamBattery {
  id: string;
  name: string;
}

export interface Worker {
  id: string;
  rut: string;
  name: string;
  position: string;
  phone?: string | null;
  managementArea: string | null;
}

export interface Company {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  worker: Worker;
  company: Company;
  
  // CAMBIO: Ahora es un array (Lista)
  examBatteries: ExamBattery[]; 
  
  ges: Ges;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  providerName?: string | null;
  externalId?: string | null;
}