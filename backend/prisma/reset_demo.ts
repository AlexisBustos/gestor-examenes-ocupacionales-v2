import { PrismaClient, UserRole, EmploymentStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👠 [DEMO] Iniciando Protocolo Cenicienta...');

  // ---------------------------------------------------------
  // 1. LIMPIEZA TOTAL (Borrar desde los hijos hacia los padres)
  // ---------------------------------------------------------
  console.log('🧹 Barriendo datos antiguos...');

  // Nivel 5: Tablas de detalle profundo
  await prisma.orderBattery.deleteMany({});
  await prisma.workerExposure.deleteMany({});
  await prisma.exposureHistory.deleteMany({});
  await prisma.gesRisk.deleteMany({});
  await prisma.odiDelivery.deleteMany({});
  await prisma.batteryExam.deleteMany({});
  await prisma.medicalRule.deleteMany({});
  
  // Nivel 4: Documentos y Reportes
  await prisma.odiDocument.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.quantitativeReport.deleteMany({});
  await prisma.tmertReport.deleteMany({});
  await prisma.gESDocument.deleteMany({});

  // Nivel 3: Operaciones principales
  await prisma.examOrder.deleteMany({}); // Las órdenes dependen de trabajadores y GES
  await prisma.workerEvent.deleteMany({});
  
  // Nivel 2: Entidades Base
  await prisma.worker.deleteMany({}); // Trabajadores dependen de empresas y CC
  await prisma.ges.deleteMany({});    // GES depende de Areas
  await prisma.technicalReport.deleteMany({});
  
  // Nivel 1: Estructura Organizacional
  await prisma.area.deleteMany({});
  await prisma.workCenter.deleteMany({});
  await prisma.costCenter.deleteMany({});
  await prisma.user.deleteMany({}); // Usuarios
  
  // Nivel 0: Catálogos Globales y Empresa Padre
  await prisma.riskProtocol.deleteMany({});
  await prisma.riskAgent.deleteMany({});
  await prisma.examBattery.deleteMany({});
  await prisma.medicalExam.deleteMany({});
  await prisma.company.deleteMany({}); // Al final borramos la empresa

  console.log('✨ Casa limpia. Base de datos vacía.');

  // ---------------------------------------------------------
  // 2. CREACIÓN DE DATOS (Sembrando el Demo)
  // ---------------------------------------------------------
  console.log('🌱 Sembrando datos frescos...');

  // A. Crear Empresa Demo
  const demoCompany = await prisma.company.create({
    data: {
      name: 'Minera Demo SpA',
      rut: '77.777.777-7',
      contactEmail: 'contacto@minerademo.cl',
      address: 'Camino La Pólvora KM 15, Valparaíso',
      phone: '+56912345678'
    },
  });

  // B. Crear Centros y Áreas
  const workCenter = await prisma.workCenter.create({
    data: {
      name: 'Faena Cordillera',
      companyId: demoCompany.id,
      areas: {
        create: [
          { name: 'Chancado Primario' },
          { name: 'Taller de Mantención' }
        ]
      }
    },
    include: { areas: true } // Para obtener los IDs de las áreas creadas
  });

  const areaTaller = workCenter.areas.find(a => a.name === 'Taller de Mantención');

  // C. Crear Usuarios
  const passwordHash = await bcrypt.hash('Demo1234', 10);

  // Usuario 1: Admin de la Empresa (El que verán tus clientes)
  await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: passwordHash,
      name: 'Administrador Demo',
      role: 'ADMIN_EMPRESA', // [cite: 147] Usamos el Enum correcto
      companyId: demoCompany.id,
    },
  });

  // Usuario 2: Super Admin Vitam (Tú)
  await prisma.user.create({
    data: {
      email: 'super@vitam.tech',
      password: passwordHash,
      name: 'Super Admin Vitam',
      role: 'ADMIN_VITAM', // [cite: 145]
      // Sin companyId porque ve todo
    },
  });

  console.log('👥 Usuarios Creados: admin@demo.com / Demo1234');

  // D. Crear Catálogos (Riesgos y Exámenes)
  const riesgoRuido = await prisma.riskAgent.create({
    data: { name: 'Ruido Ocupacional', description: 'Exposición sobre 85 dB' }
  });
  
  const riesgoSilice = await prisma.riskAgent.create({
    data: { name: 'Sílice Libre', description: 'Polvo respirable' }
  });

  // E. Crear GES (Grupo de Exposición Similar)
  if (areaTaller) {
    const gesMecanicos = await prisma.ges.create({
      data: {
        name: 'Mecánicos Soldadores',
        reportDate: new Date(),
        reportNumber: 'INF-2024-001',
        menCount: 15,
        womenCount: 2,
        areaId: areaTaller.id,
        // Asociamos riesgos al GES
        risks: {
          create: [
            { riskId: riesgoRuido.id },
            { riskId: riesgoSilice.id }
          ]
        }
      }
    });

    console.log('⚠️ GES y Riesgos creados');

    // F. Crear Trabajador
    const worker = await prisma.worker.create({
      data: {
        name: 'Juan Andrés Pérez Demo',
        rut: '12.345.678-9',
        email: 'juan.perez@demo.cl',
        position: 'Mecánico Senior',
        companyId: demoCompany.id,
        employmentStatus: 'NOMINA', // [cite: 178]
        currentGesId: gesMecanicos.id
      }
    });

    // G. Crear una Orden de Examen
    await prisma.examOrder.create({
      data: {
        workerId: worker.id,
        companyId: demoCompany.id,
        gesId: gesMecanicos.id,
        status: 'SOLICITADO', // [cite: 167]
        evaluationType: 'OCUPACIONAL',
        providerName: 'Mutual de Seguridad',
        scheduledAt: new Date(new Date().setDate(new Date().getDate() + 5)) // En 5 días
      }
    });

    console.log('👷 Trabajador y Orden creados');
  }

  console.log('🕛 ¡BUM! Demo listo para usar.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });