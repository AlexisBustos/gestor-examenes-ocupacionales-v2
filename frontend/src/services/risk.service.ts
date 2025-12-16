import axios from '../lib/axios';

// 👇 1. NUEVO TIPO: Definimos todos los modos de envío soportados
export type TargetMode = 'INDIVIDUAL' | 'COMPANY' | 'COST_CENTER' | 'AREA' | 'GES' | 'RISK_AGENT';

// --- INTERFACES (Tipos de datos) ---

export interface RiskAgent {
  id: string;
  name: string;
  description?: string;
  documents: {
    id: string;
    title: string;
    publicUrl: string;
    createdAt: string;
  }[];
}

// Para manejar el historial de envíos
export interface OdiDelivery {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'VIEWED';
  sentAt: string;
  confirmedAt?: string;
  ipAddress?: string;
  worker: {
    name: string;
    rut: string;
    email?: string;
  };
  document: {
    title: string;
    agent: {
      name: string;
    };
  };
}

// --- FUNCIONES CRUD DE RIESGOS ---

// 1. OBTENER RIESGOS
export const getRisks = async (): Promise<RiskAgent[]> => {
  const response = await axios.get('/risks');
  return response.data;
};

// 2. CREAR/SUBIR RIESGO
export const createRisk = async (name: string, description: string, file: File | null) => {
  const formData = new FormData();
  formData.append('name', name);
  if (description) formData.append('description', description);
  
  if (file) {
    formData.append('pdf', file);
  }

  const response = await axios.post('/risks', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// 3. ELIMINAR RIESGO
export const deleteRisk = async (id: string) => {
  await axios.delete(`/risks/${id}`);
};

// --- FUNCIONES DE DISTRIBUCIÓN Y CORREO ---

// 4. ENVIAR CORREO DE DIFUSIÓN (ACTUALIZADO CON TargetMode)
export const sendRiskDistribution = async (
  riskId: string, 
  targetMode: TargetMode, // 👈 Usamos el nuevo tipo aquí
  targetId: string | null,              
  email: string, 
  subject: string, 
  message: string,
  documentIds: string[]
) => {
  await axios.post('/risks/send-email', {
    riskId,
    targetMode,
    targetId,
    email,
    subject,
    message,
    documentIds
  });
};

// 5. OBTENER CONTEO PREVIO (ACTUALIZADO CON TargetMode)
export const getRecipientCount = async (targetMode: TargetMode, targetId: string | null) => {
  const response = await axios.post('/risks/count-targets', {
    targetMode,
    targetId
  });
  return response.data.count;
};

// 6. CONFIRMAR TOKEN (Firma Digital)
export const confirmOdiToken = async (token: string) => {
  const response = await axios.post('/risks/confirm', { token });
  return response.data;
};

// --- FUNCIONES DE HISTORIAL ---

// 7. OBTENER HISTORIAL GLOBAL
export const getGlobalHistory = async (): Promise<OdiDelivery[]> => {
  const response = await axios.get('/risks/history');
  return response.data;
};

// 8. OBTENER HISTORIAL DE UN TRABAJADOR
export const getWorkerOdiHistory = async (workerId: string): Promise<OdiDelivery[]> => {
  const response = await axios.get(`/risks/history/${workerId}`);
  return response.data;
};