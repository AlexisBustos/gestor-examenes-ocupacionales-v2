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

// Obtener UNA con Estadísticas (ESTO ES LO QUE FALTA)
export const getCompanyById = async (id: string) => {
  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) return null;

  // 1. Contar Trabajadores
  const workersCount = await prisma.worker.count({
    where: { companyId: id },
  });

  // 2. Contar GES
  const gesCount = await prisma.ges.count({
    where: {
      area: {
        workCenter: {
          companyId: id,
        },
      },
    },
  });

  // 3. Contar Riesgos
  const riskCount = await prisma.riskExposure.count({
    where: {
      ges: {
        area: {
          workCenter: {
            companyId: id,
          },
        },
      },
    },
  });

  // Devolver objeto fusionado
  return {
    ...company,
    stats: {
      workersCount,
      gesCount,
      riskCount,
    },
  };
};

// Actualizar
export const updateCompany = async (id: string, data: any) => {
  return await prisma.company.update({
    where: { id },
    data,
  });
};

// Borrar
export const deleteCompany = async (id: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.examOrder.deleteMany({ where: { companyId: id } });
    await tx.worker.deleteMany({ where: { companyId: id } });
    
    const workCenters = await tx.workCenter.findMany({ where: { companyId: id }, select: { id: true } });
    const workCenterIds = workCenters.map(wc => wc.id);
    const areas = await tx.area.findMany({ where: { workCenterId: { in: workCenterIds } }, select: { id: true } });
    const areaIds = areas.map(a => a.id);
    const gesList = await tx.ges.findMany({ where: { areaId: { in: areaIds } }, select: { id: true } });
    const gesIds = gesList.map(g => g.id);

    await tx.riskExposure.deleteMany({ where: { gesId: { in: gesIds } } });
    await tx.ges.deleteMany({ where: { areaId: { in: areaIds } } });
    await tx.area.deleteMany({ where: { workCenterId: { in: workCenterIds } } });
    await tx.workCenter.deleteMany({ where: { companyId: id } });
    
    return await tx.company.delete({ where: { id } });
  });
};