import { PrismaClient, EvaluationType, UserRole, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PROTOCOLOS = [
  { agente: "Ruido", bateria: "Protocolo RUIDO (Prexor)", examenes: ["Encuesta de salud", "Audiometría"] },
  { agente: "Sílice", bateria: "Protocolo SÍLICE", examenes: ["Espirometría", "Rx Tórax"] },
  { agente: "Solventes", bateria: "Protocolo SOLVENTES", examenes: ["Hemograma", "Perfil Hepático"] },
  { agente: "Estrés Térmico Calor", bateria: "Protocolo ESTRÉS TÉRMICO", examenes: ["Creatinina", "Electrolitos"] },
];

async function main() {
  console.log('🌱 Restaurando sistema...');

  // 1. LIMPIEZA
  try {
    await prisma.orderBattery.deleteMany();
    await prisma.examOrder.deleteMany();
    await prisma.riskExposure.deleteMany();
    await prisma.batteryExam.deleteMany();
    await prisma.examBattery.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.ges.deleteMany();
    await prisma.area.deleteMany();
    await prisma.workCenter.deleteMany();
    // No borramos user/company para usar upsert
  } catch (e) { console.log('Limpieza parcial.'); }

  // 2. ADMIN
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@vitam.cl' },
    update: { password: hashedPassword, role: UserRole.ADMIN_VITAM },
    create: { email: 'admin@vitam.cl', password: hashedPassword, name: 'Admin', role: UserRole.ADMIN_VITAM },
  });
  console.log('👤 Admin restaurado.');

  // 3. PROTOCOLOS
  let bateriaEjemploId = '';
  for (const proto of PROTOCOLOS) {
    await prisma.riskAgent.upsert({ where: { name: proto.agente }, update: {}, create: { name: proto.agente } });
    
    const examIds = [];
    for (const exName of proto.examenes) {
      const ex = await prisma.medicalExam.upsert({ where: { name: exName }, update: {}, create: { name: exName } });
      examIds.push(ex.id);
    }

    const bat = await prisma.examBattery.findFirst({ where: { name: proto.bateria } });
    if (!bat) {
      const newBat = await prisma.examBattery.create({
        data: {
          name: proto.bateria,
          evaluationType: EvaluationType.OCUPACIONAL,
          batteryExams: { create: examIds.map(id => ({ medicalExamId: id })) }
        }
      });
      bateriaEjemploId = newBat.id;
    } else {
      bateriaEjemploId = bat.id;
    }
  }

  // 4. EMPRESA BASE Y ESTRUCTURA (Necesario para la orden)
  const company = await prisma.company.upsert({
    where: { rut: '99.999.999-9' },
    update: {},
    create: { rut: '99.999.999-9', name: 'EMPRESA DEMO', contactEmail: 'demo@vitam.cl' }
  });

  const workCenter = await prisma.workCenter.create({
    data: { name: 'Centro Base', companyId: company.id }
  });

  const area = await prisma.area.create({
    data: { name: 'Area Base', workCenterId: workCenter.id }
  });

  // 👇 CREAMOS UN GES DE PRUEBA (Obligatorio para la orden)
  const ges = await prisma.ges.create({
    data: {
      name: 'GES PRUEBA',
      reportDate: new Date(),
      reportNumber: '001',
      menCount: 1,
      womenCount: 0,
      areaId: area.id
    }
  });

  // 5. CREAR ORDEN DE PRUEBA
  const worker = await prisma.worker.upsert({
    where: { rut: '11.222.333-4' },
    update: {},
    create: { rut: '11.222.333-4', name: 'Trabajador Prueba', companyId: company.id }
  });

  await prisma.examOrder.create({
    data: {
      workerId: worker.id,
      companyId: company.id,
      gesId: ges.id, // <--- AHORA SÍ LO TENEMOS
      status: 'AGENDADO',
      scheduledAt: new Date(),
      providerName: 'ACHS',
      orderBatteries: {
        create: [
            { batteryId: bateriaEjemploId, status: 'PENDIENTE' }
        ]
      }
    }
  });

  console.log('✅ Sistema actualizado y datos de prueba creados.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });