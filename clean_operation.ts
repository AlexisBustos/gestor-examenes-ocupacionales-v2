import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando datos operativos...');

  // 1. Borrar Órdenes y Resultados
  await prisma.orderBattery.deleteMany();
  await prisma.examOrder.deleteMany();
  console.log('✅ Órdenes eliminadas.');

  // 2. Borrar GES y Documentos (Pero no empresas ni trabajadores)
  // OJO: Si borras GES, se desconectan de los trabajadores.
  await prisma.riskExposure.deleteMany();
  // Desconectar GES de trabajadores antes de borrar
  await prisma.worker.updateMany({ data: { currentGesId: null } });
  await prisma.ges.deleteMany();
  await prisma.technicalReport.deleteMany();
  await prisma.quantitativeReport.deleteMany();
  await prisma.prescription.deleteMany();
  
  // Opcional: Borrar empresas si quieres empezar de cero absoluto (menos admin)
  // await prisma.workCenter.deleteMany();
  // await prisma.area.deleteMany();
  // await prisma.company.deleteMany();

  console.log('✅ Datos operativos limpios. Nómina y Baterías intactas.');
}

main().finally(() => prisma.$disconnect());