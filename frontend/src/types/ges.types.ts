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

// NUEVA ENTIDAD: El Informe Técnico Compartido
export interface TechnicalReport {
  id: string;
  reportNumber: string;
  reportDate: string;
  pdfUrl: string;
}

export interface Ges {
  id: string;
  name: string;

  // Datos operativos
  areaId?: string;
  menCount?: number;
  womenCount?: number;
  tasksDescription?: string;
  subArea?: string; // <--- Nuevo campo
  machineryUsed?: string;
  controlMeasures?: string;

  // CONEXIÓN NUEVA: Apunta al informe centralizado
  technicalReportId?: string | null;
  technicalReport?: TechnicalReport | null;

  // Vigencia
  nextEvaluationDate?: string | null;
  validityYears?: number | null;

  // Relaciones
  riskExposures?: RiskExposure[];
  prescriptions?: string;

  // Relaciones expandidas (opcionales)
  area?: {
    id: string;
    name: string;
  };
  _count?: {
    riskExposures: number;
  };
}