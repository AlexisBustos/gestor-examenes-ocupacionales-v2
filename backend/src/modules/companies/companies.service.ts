import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- FUNCIONES EXISTENTES (CREAR, LISTAR, GET, UPDATE, DELETE) ---
// (Mantenlas tal cual me las pasaste, son correctas)

export const createCompany = async (data: any) => {
  return await prisma.company.create({ data });
};

export const getAllCompanies = async () => {
  return await prisma.company.findMany({ orderBy: { name: 'asc' } });
};

export const getCompanyById = async (id: string) => {
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return null;

  const workersCount = await prisma.worker.count({ where: { companyId: id } });
  const gesCount = await prisma.ges.count({ where: { area: { workCenter: { companyId: id } } } });
  const riskCount = await prisma.riskExposure.count({ where: { ges: { area: { workCenter: { companyId: id } } } } });

  const gesList = await prisma.ges.findMany({
    where: { area: { workCenter: { companyId: id } } },
    include: {
      area: { include: { costCenter: true } },
      technicalReport: {
        include: {
          prescriptions: true,
          quantitativeReports: { include: { prescriptions: true } },
        },
      },
      riskExposures: true,
      _count: { select: { riskExposures: true } },
    },
    orderBy: { name: 'asc' },
  });

  const enrichedGesList = gesList.map((ges) => {
    const technicalReport = ges.technicalReport || null;
    const quantReports = technicalReport?.quantitativeReports || [];
    const qualPresc = technicalReport?.prescriptions || [];
    const quantPresc = quantReports.flatMap((q) => q.prescriptions || []);
    const isActive = !!technicalReport || quantReports.length > 0 || qualPresc.length > 0 || quantPresc.length > 0;

    return { ...ges, isActive };
  });

  return { ...company, stats: { workersCount, gesCount, riskCount }, gesList: enrichedGesList };
};

export const updateCompany = async (id: string, data: any) => {
  return await prisma.company.update({ where: { id }, data });
};

export const deleteCompany = async (id: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.examOrder.deleteMany({ where: { companyId: id } });
    await tx.worker.deleteMany({ where: { companyId: id } });
    await tx.user.deleteMany({ where: { companyId: id } });
    await tx.technicalReport.deleteMany({ where: { companyId: id } });
    
    // ... lógica de borrado en cascada que ya tenías ...
    const workCenters = await tx.workCenter.findMany({ where: { companyId: id }, select: { id: true } });
    const workCenterIds = workCenters.map((wc) => wc.id);
    const areas = await tx.area.findMany({ where: { workCenterId: { in: workCenterIds } }, select: { id: true } });
    const areaIds = areas.map((a) => a.id);
    const gesList = await tx.ges.findMany({ where: { areaId: { in: areaIds } }, select: { id: true } });
    const gesIds = gesList.map((g) => g.id);

    await tx.riskExposure.deleteMany({ where: { gesId: { in: gesIds } } });
    await tx.ges.deleteMany({ where: { areaId: { in: areaIds } } });
    await tx.area.deleteMany({ where: { workCenterId: { in: workCenterIds } } });
    await tx.workCenter.deleteMany({ where: { companyId: id } });

    return await tx.company.delete({ where: { id } });
  });
};

// 👇 NUEVAS FUNCIONES PARA GUARDAR INFORMES (CONECTADAS A S3) 👇

// Guardar Informe Cualitativo
export const addTechnicalReportDb = async (data: { companyId: string, reportNumber: string, reportDate: Date, pdfUrl: string }) => {
    return await prisma.technicalReport.create({
        data: {
            companyId: data.companyId,
            reportNumber: data.reportNumber,
            reportDate: data.reportDate,
            pdfUrl: data.pdfUrl // URL de S3
        }
    });
};

// Guardar Informe Cuantitativo
export const addQuantitativeReportDb = async (data: { technicalReportId: string, name: string, reportDate: Date, pdfUrl: string }) => {
    return await prisma.quantitativeReport.create({
        data: {
            technicalReportId: data.technicalReportId,
            name: data.name,
            reportDate: data.reportDate,
            pdfUrl: data.pdfUrl // URL de S3
        }
    });
};

// Eliminar informe cualitativo
export const deleteTechnicalReportDb = async (id: string) => {
  return await prisma.technicalReport.delete({ where: { id } });
};

// Eliminar informe cuantitativo
export const deleteQuantitativeReportDb = async (id: string) => {
  return await prisma.quantitativeReport.delete({ where: { id } });
};