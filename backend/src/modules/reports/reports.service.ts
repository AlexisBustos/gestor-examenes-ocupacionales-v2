import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CREAR PRESCRIPCIÓN ---
// Esta función es polimórfica: sirve para Technical, Quantitative, TMERT y ahora AGENTES
export const createPrescription = async (data: {
  technicalReportId?: string;    // Opcional
  quantitativeReportId?: string; // Opcional
  tmertReportId?: string;        // Opcional (si es TMERT)
  riskAgentId?: string;          // 👈 NUEVO: Opcional (Asociar a Agente)
  folio?: string;
  description: string;
  measureType?: string;
  isImmediate: boolean;
  implementationDate: string;    
  observation?: string;
  status?: 'PENDIENTE' | 'EN_PROCESO' | 'REALIZADA' | 'VENCIDA';
}) => {
  
  // Validar que al menos uno de los IDs de informe venga
  // (La asociación a reporte es obligatoria, el agente es un extra)
  if (!data.technicalReportId && !data.quantitativeReportId && !data.tmertReportId) {
    throw new Error("Debe asociar la prescripción a un informe Técnico, Cuantitativo o TMERT.");
  }

  return await prisma.prescription.create({
    data: {
      folio: data.folio,
      description: data.description,
      measureType: data.measureType,
      isImmediate: data.isImmediate,
      implementationDate: new Date(data.implementationDate), 
      observation: data.observation,
      status: data.status || 'PENDIENTE',
      
      // Conexiones (Prisma ignorará los que sean undefined)
      technicalReportId: data.technicalReportId,
      quantitativeReportId: data.quantitativeReportId,
      tmertReportId: data.tmertReportId,
      
      // 👇 NUEVO: Guardamos la relación con el Agente
      riskAgentId: data.riskAgentId 
    }
  });
};

// --- ACTUALIZAR PRESCRIPCIÓN ---
export const updatePrescription = async (id: string, data: {
  status?: 'PENDIENTE' | 'EN_PROCESO' | 'REALIZADA' | 'VENCIDA';
  implementationDate?: string;
  observation?: string;
  description?: string;
  // Opcional: Si quisieras editar el agente después, podrías agregarlo aquí también
}) => {
  return await prisma.prescription.update({
    where: { id },
    data: {
      status: data.status,
      observation: data.observation,
      description: data.description,
      implementationDate: data.implementationDate ? new Date(data.implementationDate) : undefined
    }
  });
};

// --- ELIMINAR PRESCRIPCIÓN ---
export const deletePrescription = async (id: string) => {
  return await prisma.prescription.delete({ where: { id } });
};