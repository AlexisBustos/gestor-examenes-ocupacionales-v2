import { PrismaClient, ExposureType, EvaluationType, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Limpiar base de datos (Orden inverso para respetar Foreign Keys)
  await prisma.examOrder.deleteMany();
  await prisma.batteryExam.deleteMany();
  await prisma.examBattery.deleteMany();
  await prisma.riskExposure.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.ges.deleteMany();
  await prisma.area.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.company.deleteMany();
  await prisma.riskAgent.deleteMany();
  await prisma.medicalExam.deleteMany();

  // 2. Crear Empresa (WEIR)
  const company = await prisma.company.create({
    data: {
      rut: '76.123.456-7',
      name: 'WEIR MINERALS',
      contactEmail: 'contacto@weir.com',
      address: 'Av. La Montaña 123',
      phone: '+56222222222',
    },
  });

  // 3. Crear Jerarquía
  const workCenter = await prisma.workCenter.create({
    data: {
      name: 'Planta 1',
      address: 'San Bernardo',
      companyId: company.id,
    },
  });

  const area = await prisma.area.create({
    data: {
      name: 'Gerencia de Operaciones',
      workCenterId: workCenter.id,
    },
  });

  // 4. Catálogos Técnicos (Riesgos)
  const agenteRuido = await prisma.riskAgent.create({ data: { name: 'Ruido Ocupacional' } });
  const agenteSilice = await prisma.riskAgent.create({ data: { name: 'Sílice Libre Cristalizada' } });
  const agenteHumos = await prisma.riskAgent.create({ data: { name: 'Humos Metálicos' } });

  // 5. Catálogos Médicos (Exámenes)
  const exAudio = await prisma.medicalExam.create({ data: { name: 'Audiometría' } });
  const exEspiro = await prisma.medicalExam.create({ data: { name: 'Espirometría' } });
  const exRx = await prisma.medicalExam.create({ data: { name: 'Rx Tórax OIT' } });
  const exVisiometria = await prisma.medicalExam.create({ data: { name: 'Visiometría' } });

  // 6. Crear Baterías (La receta médica)
  const bateriaHumos = await prisma.examBattery.create({
    data: {
      name: 'Batería Humos Metálicos',
      evaluationType: EvaluationType.OCUPACIONAL,
      batteryExams: {
        create: [
          { medicalExamId: exEspiro.id },
          { medicalExamId: exRx.id },
        ],
      },
    },
  });

  // 7. Crear GES (Soldadores)
  const ges = await prisma.ges.create({
    data: {
      name: 'SOLDADORES TALLER',
      reportDate: new Date(),
      reportNumber: 'INF-2025-001',
      menCount: 15,
      womenCount: 2,
      tasksDescription: 'Soldadura al arco y mig en estructuras metálicas.',
      validityYears: 1,
      nextEvaluationDate: new Date('2026-11-22'),
      risksResume: 'Humos Metálicos, Ruido',
      prescriptions: 'Uso obligatorio de máscara de soldar con filtro y protección auditiva tipo copa',
      areaId: area.id,
      // Asignar riesgos
      riskExposures: {
        create: [
          {
            riskAgentId: agenteRuido.id,
            exposureType: ExposureType.CRONICA, // <--- CORREGIDO A ESPAÑOL
          },
          {
            riskAgentId: agenteHumos.id,
            exposureType: ExposureType.AGUDA,   // <--- CORREGIDO A ESPAÑOL
            // Conectar batería a este riesgo
            examBatteries: {
              connect: { id: bateriaHumos.id }
            }
          },
        ],
      },
    },
  });

  // 8. Crear Trabajador (Pedro Pascal)
  const worker = await prisma.worker.create({
    data: {
      rut: '15.555.666-8',
      name: 'Juan Pérez', // (O Pedro Pascal)
      position: 'Soldador',
      managementArea: 'Gerencia de Operaciones',
      currentGesId: ges.id,
      companyId: company.id, // <--- CORREGIDO: Faltaba asignar la empresa
    },
  });

  // 9. Crear Orden de Prueba
  await prisma.examOrder.create({
    data: {
      status: OrderStatus.AGENDADO,
      workerId: worker.id,
      companyId: company.id,
      gesId: ges.id,
      examBatteryId: bateriaHumos.id,
      providerName: 'ACHS',
      scheduledAt: new Date('2025-11-25'),
      externalId: 'ORD-ACHS-999',
    },
  });

  console.log('✅ Seed completado correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });