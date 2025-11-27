import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- PRESCRIPCIONES ---

export const createPrescription = async (data: {
  technicalReportId?: string;
  quantitativeReportId?: string;
  folio?: string;
  description: string;
  measureType?: string;
  isImmediate: boolean;
  implementationDate: string;
  observation?: string;
}) => {
  return await prisma.prescription.create({
    data: {
      folio: data.folio,
      description: data.description,
      measureType: data.measureType,
      isImmediate: data.isImmediate,
      implementationDate: new Date(data.implementationDate),
      observation: data.observation,
      status: 'PENDIENTE',
      technicalReportId: data.technicalReportId || undefined,
      quantitativeReportId: data.quantitativeReportId || undefined,
    }
  });
};

export const deletePrescription = async (id: string) => {
  return await prisma.prescription.delete({ where: { id } });
};

// 👇 ESTA ES LA FUNCIÓN MEJORADA (Recibe el status específico)
export const updatePrescriptionStatus = async (id: string, status: string) => {
  return await prisma.prescription.update({
    where: { id },
    data: { status: status as any } // Actualiza al estado que le digamos
  });
};

// --- INFORMES CUANTITATIVOS ---

export const createQuantitativeReport = async (data: {
  technicalReportId: string;
  name: string;
  reportDate: string;
  filename: string;
}) => {
  return await prisma.quantitativeReport.create({
    data: {
      name: data.name,
      reportDate: new Date(data.reportDate),
      pdfUrl: `/uploads/${data.filename}`,
      technicalReportId: data.technicalReportId
    }
  });
};

export const deleteQuantitativeReport = async (id: string) => {
    return await prisma.quantitativeReport.delete({ where: { id }});
}