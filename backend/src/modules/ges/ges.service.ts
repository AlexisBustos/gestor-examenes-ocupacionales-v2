import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllGes = async () => {
  return await prisma.ges.findMany({
    include: {
      riskExposures: { include: { riskAgent: true, examBatteries: true } },
      technicalReport: true,
    },
  });
};

export const getGesById = async (id: string) => {
  return await prisma.ges.findUnique({
    where: { id },
    include: {
      riskExposures: { include: { riskAgent: true } },
      technicalReport: true,
      area: { include: { workCenter: true } }
    },
  });
};

export const createGes = async (data: any) => {
  return await prisma.ges.create({ data });
};

// FUNCIÓN DE SUBIDA INTELIGENTE
export const uploadGesReport = async (
  gesId: string,
  fileData: { path: string; filename: string },
  meta: { reportDate: string; reportNumber: string; applyToArea?: boolean }
) => {

  // 1. Buscar el GES y su Área
  const ges = await prisma.ges.findUnique({
    where: { id: gesId },
    include: { area: { include: { workCenter: true } } }
  });

  if (!ges) throw new Error("GES no encontrado");

  const companyId = ges.area.workCenter.companyId;
  const areaId = ges.areaId;

  // 2. Crear el Informe Técnico Centralizado
  const report = await prisma.technicalReport.create({
    data: {
      pdfUrl: `/uploads/${fileData.filename}`,
      reportNumber: meta.reportNumber,
      reportDate: new Date(meta.reportDate),
      companyId: companyId,
      // Conectamos al GES actual sí o sí
      gesGroups: {
        connect: { id: gesId }
      }
    }
  });

  // 3. Calcular Vigencia (Fecha + 3 años)
  const nextDate = new Date(meta.reportDate);
  nextDate.setFullYear(nextDate.getFullYear() + 3);

  // 4. ¿APLICAR A TODOS LOS DEL ÁREA?
  if (meta.applyToArea) {
    console.log(`🔄 Replicando informe a toda el área: ${ges.area.name}`);

    // Actualizamos TODOS los GES del área
    await prisma.ges.updateMany({
      where: { areaId: areaId },
      data: {
        nextEvaluationDate: nextDate,
        technicalReportId: report.id // <--- ¡ESTA ES LA LÍNEA QUE FALTABA!
      }
    });

  } else {
    // Solo actualizar el actual
    await prisma.ges.update({
      where: { id: gesId },
      data: {
        nextEvaluationDate: nextDate,
        technicalReportId: report.id
      }
    });
  }

  return report;
};