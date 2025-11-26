export type OrderStatus = 'SOLICITADO' | 'AGENDADO' | 'REALIZADO' | 'CERRADO' | 'ANULADO';

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
  reportUrl?: string | null;
  reportNumber?: string | null;
  reportDate?: string | null;
  nextEvaluationDate?: string | null;
}

export interface ExamBattery {
  id: string;
  name: string;
}

// Estructura de la tabla intermedia
export interface OrderBattery {
    id: string;
    status: 'PENDIENTE' | 'APTO' | 'NO_APTO' | 'APTO_CON_OBSERVACIONES';
    battery: ExamBattery;
    expirationDate?: string;
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
  
  // 👇 AQUI ESTÁ EL CAMBIO CLAVE
  orderBatteries?: OrderBattery[]; // Lista nueva con detalles
  examBatteries?: ExamBattery[];   // Lista vieja (por compatibilidad si queda algo)
  
  ges: Ges;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  providerName?: string | null;
  externalId?: string | null;
}