import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CREAR PRESCRIPCIÓN ---
// Esta función es polimórfica: sirve para TechnicalReport O QuantitativeReport
export const createPrescription = async (data: {
  technicalReportId?: string;    // Opcional (si es cualitativo)
  quantitativeReportId?: string; // Opcional (si es cuantitativo)
  folio?: string;
  description: string;
  measureType?: string;
  isImmediate: boolean;
  implementationDate: string;    // Viene como string del frontend
  observation?: string;
  status?: 'PENDIENTE' | 'EN_PROCESO' | 'REALIZADA' | 'VENCIDA';
}) => {
  
  // Validar que al menos uno de los IDs venga
  if (!data.technicalReportId && !data.quantitativeReportId) {
    throw new Error("Debe asociar la prescripción a un informe Técnico o Cuantitativo.");
  }

  return await prisma.prescription.create({
    data: {
      folio: data.folio,
      description: data.description,
      measureType: data.measureType,
      isImmediate: data.isImmediate,
      implementationDate: new Date(data.implementationDate), // Convertir a Date
      observation: data.observation,
      status: data.status || 'PENDIENTE',
      // Conexiones (uno de los dos será undefined, Prisma lo ignora)
      technicalReportId: data.technicalReportId,
      quantitativeReportId: data.quantitativeReportId
    }
  });
};

// --- ACTUALIZAR PRESCRIPCIÓN ---
export const updatePrescription = async (id: string, data: {
  status?: 'PENDIENTE' | 'EN_PROCESO' | 'REALIZADA' | 'VENCIDA';
  implementationDate?: string;
  observation?: string;
  description?: string;
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

// (Mantén aquí tus otras funciones de reports si existen, como createQuantitativeReport)