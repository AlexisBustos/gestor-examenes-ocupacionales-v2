import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear empresa
export const createCompany = async (data: any) => {
  return await prisma.company.create({ data });
};

// Listar todas
export const getAllCompanies = async () => {
  return await prisma.company.findMany({
    orderBy: { name: 'asc' },
  });
};

// Obtener UNA con Estadísticas y Lista
export const getCompanyById = async (id: string) => {
  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) return null;

  const workersCount = await prisma.worker.count({ where: { companyId: id } });
  const gesCount = await prisma.ges.count({ where: { area: { workCenter: { companyId: id } } } });
  const riskCount = await prisma.riskExposure.count({ where: { ges: { area: { workCenter: { companyId: id } } } } });

  const gesList = await prisma.ges.findMany({
    where: { area: { workCenter: { companyId: id } } },
    include: {
      area: { include: { costCenter: true } },
      technicalReport: true, // Incluimos el reporte para saber si tiene PDF
      _count: { select: { riskExposures: true } },
    },
    orderBy: { name: 'asc' }
  });

  return {
    ...company,
    stats: { workersCount, gesCount, riskCount },
    gesList,
  };
};

// Actualizar
export const updateCompany = async (id: string, data: any) => {
  return await prisma.company.update({
    where: { id },
    data,
  });
};

// Borrar (LIMPIEZA TOTAL EN CASCADA)
export const deleteCompany = async (id: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Borrar Órdenes
    await tx.examOrder.deleteMany({ where: { companyId: id } });

    // 2. Borrar Trabajadores
    await tx.worker.deleteMany({ where: { companyId: id } });

    // 3. Borrar Usuarios Clientes (Si hay usuarios tipo empresa)
    await tx.user.deleteMany({ where: { companyId: id } });

    // 4. Borrar Informes Técnicos (PDFs) - ¡ESTO FALTABA!
    // Primero desconectamos los GES para evitar error circular, aunque cascade debería manejarlo
    // Pero mejor borramos los reportes directos de la empresa
    await tx.technicalReport.deleteMany({ where: { companyId: id } });

    // 5. Estructura (WorkCenters -> Areas -> GES)
    const workCenters = await tx.workCenter.findMany({ where: { companyId: id }, select: { id: true } });
    const workCenterIds = workCenters.map(wc => wc.id);

    const areas = await tx.area.findMany({ where: { workCenterId: { in: workCenterIds } }, select: { id: true } });
    const areaIds = areas.map(a => a.id);

    const gesList = await tx.ges.findMany({ where: { areaId: { in: areaIds } }, select: { id: true } });
    const gesIds = gesList.map(g => g.id);

    // Borrar Riesgos
    await tx.riskExposure.deleteMany({ where: { gesId: { in: gesIds } } });

    // Borrar GES
    await tx.ges.deleteMany({ where: { areaId: { in: areaIds } } });

    // Borrar Áreas
    await tx.area.deleteMany({ where: { workCenterId: { in: workCenterIds } } });

    // Borrar Centros
    await tx.workCenter.deleteMany({ where: { companyId: id } });

    // 6. Finalmente, borrar la empresa
    return await tx.company.delete({ where: { id } });
  });
};