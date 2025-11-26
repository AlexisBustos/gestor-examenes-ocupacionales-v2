export interface RiskAgent {
  id: string;
  name: string;
  protocolUrl?: string;
}

export interface RiskExposure {
  id: string;
  riskAgent: RiskAgent;
  specificAgentDetails?: string;
  exposureType?: string;
  examBatteries?: { id: string; name: string }[];
}

// Definición de Prescripción
export interface Prescription {
  id: string;
  folio?: string;
  description: string;
  measureType?: string;
  isImmediate: boolean;
  implementationDate: string;
  observation?: string;
  status: 'PENDIENTE' | 'REALIZADA' | 'EN_PROCESO' | 'VENCIDA';
}

// Definición de Informe Cuantitativo
export interface QuantitativeReport {
  id: string;
  name: string;
  reportDate: string;
  pdfUrl: string;
  prescriptions: Prescription[];
}

// Definición de Informe Técnico (Cualitativo)
export interface TechnicalReport {
  id: string;
  reportNumber: string;
  reportDate: string;
  pdfUrl: string;
  // Relaciones
  quantitativeReports: QuantitativeReport[];
  prescriptions: Prescription[];
}

export interface Ges {
  id: string;
  name: string;
  areaId?: string;
  menCount?: number;
  womenCount?: number;
  tasksDescription?: string;

  // Relación con Informe Técnico (Centralizado)
  technicalReportId?: string | null;
  technicalReport?: TechnicalReport | null;

  nextEvaluationDate?: string | null;
  validityYears?: number | null;

  riskExposures?: RiskExposure[];
  prescriptions?: string;
}