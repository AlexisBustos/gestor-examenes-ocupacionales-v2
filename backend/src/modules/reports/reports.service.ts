import prisma from '../../lib/prisma';

export const createReport = async (data: {
    reportNumber: string;
    reportDate: Date;
    pdfUrl: string;
    companyId: string;
}) => {
    return await prisma.technicalReport.create({
        data,
    });
};

export const getReportsByCompany = async (companyId: string) => {
    return await prisma.technicalReport.findMany({
        where: { companyId },
        orderBy: { reportDate: 'desc' },
    });
};

export const linkReportToGes = async (gesId: string, technicalReportId: string) => {
    return await prisma.ges.update({
        where: { id: gesId },
        data: { technicalReportId },
        include: { technicalReport: true },
    });
};

export const linkReportToArea = async (areaId: string, technicalReportId: string) => {
    // Update all GES in the area
    return await prisma.ges.updateMany({
        where: { areaId },
        data: { technicalReportId },
    });
};
