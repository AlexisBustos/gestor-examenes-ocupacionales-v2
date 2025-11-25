// 1. Estados posibles de la orden
export type OrderStatus = 'SOLICITADO' | 'AGENDADO' | 'REALIZADO' | 'CERRADO' | 'ANULADO';

// 2. Sub-Entidades (Riesgos, GES, Baterías)
export interface RiskAgent {
  id: string;
  name: string;
}

export interface RiskExposure {
  id: string;
  riskAgent: RiskAgent;
  specificAgentDetails?: string;
  exposureType?: string;
}

export interface Ges {
  id: string;
  name: string;
  riskExposures?: RiskExposure[];
  prescriptions?: string;
  // Campos documentales
  reportUrl?: string | null;
  reportNumber?: string | null;
  reportDate?: string | null;
  nextEvaluationDate?: string | null;
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

// 3. La Orden Principal
export interface Order {
  id: string;
  status: OrderStatus;
  worker: Worker;
  company: Company;
  examBatteries: ExamBattery[]; // Array de baterías
  ges: Ges;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  providerName?: string | null;
  externalId?: string | null;
}