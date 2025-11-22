import { PrismaClient, ExposureType, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Limpiar base de datos (orden inverso para FKs)
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

    // 2. Crear Empresa: WEIR MINERALS
    const weir = await prisma.company.create({
        data: {
            rut: '76.123.456-7',
            name: 'WEIR MINERALS',
            contactEmail: 'contacto@weir.com',
            address: 'Av. La Montaña 123',
            phone: '+56222222222',
        },
    });

    // 3. Jerarquía: Planta 1 -> Gerencia de Operaciones
    const planta1 = await prisma.workCenter.create({
        data: {
            name: 'Planta 1',
            address: 'Panamericana Norte Km 20',
            companyId: weir.id,
        },
    });

    const gerenciaOps = await prisma.area.create({
        data: {
            name: 'Gerencia de Operaciones',
            workCenterId: planta1.id,
        },
    });

    // 4. Catálogos Técnicos
    // Agentes
    const ruido = await prisma.riskAgent.create({ data: { name: 'Ruido' } });
    const silice = await prisma.riskAgent.create({ data: { name: 'Sílice' } });
    const humos = await prisma.riskAgent.create({ data: { name: 'Humos Metálicos' } });
    const proyeccion = await prisma.riskAgent.create({ data: { name: 'Proyección de Partículas' } });

    // Exámenes
    const audiometria = await prisma.medicalExam.create({ data: { name: 'Audiometría' } });
    const espirometria = await prisma.medicalExam.create({ data: { name: 'Espirometría' } });
    const rxTorax = await prisma.medicalExam.create({ data: { name: 'Rx Tórax' } });
    const optometria = await prisma.medicalExam.create({ data: { name: 'Optometría (Visiometría)' } });

    // 5. GES: SOLDADORES TALLER
    const gesSoldadores = await prisma.ges.create({
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
            areaId: gerenciaOps.id,
        },
    });

    // 6. Asignar Riesgos y Baterías
    // Riesgo: Humos Metálicos -> Batería Humos (Espirometría + Rx Tórax)
    const expHumos = await prisma.riskExposure.create({
        data: {
            gesId: gesSoldadores.id,
            riskAgentId: humos.id,
            exposureType: ExposureType.CHRONIC,
        },
    });

    const batHumos = await prisma.examBattery.create({
        data: {
            name: 'Batería Humos Metálicos',
        },
    });

    // Relacionar batería con exposición (si el modelo lo permitiera directamente, pero aquí lo hacemos lógico o si hay tabla intermedia)
    // Nota: El modelo actual tiene ExamBattery <-> RiskExposure M-N implícito o explícito?
    // Revisando schema: ExamBattery tiene `riskExposures RiskExposure[]`. Es M-N implícito.
    // Vamos a conectarlo.
    await prisma.examBattery.update({
        where: { id: batHumos.id },
        data: {
            riskExposures: {
                connect: { id: expHumos.id },
            },
            batteryExams: {
                create: [
                    { medicalExamId: espirometria.id },
                    { medicalExamId: rxTorax.id },
                ],
            },
        },
    });

    // Riesgo: Ruido -> Batería Ruido (Audiometría)
    const expRuido = await prisma.riskExposure.create({
        data: {
            gesId: gesSoldadores.id,
            riskAgentId: ruido.id,
            exposureType: ExposureType.CHRONIC,
        },
    });

    const batRuido = await prisma.examBattery.create({
        data: {
            name: 'Batería Ruido',
            riskExposures: { connect: { id: expRuido.id } },
            batteryExams: {
                create: [{ medicalExamId: audiometria.id }],
            },
        },
    });

    // 7. Trabajador: Juan Pérez
    const juanPerez = await prisma.worker.create({
        data: {
            rut: '15.555.666-8',
            name: 'Juan Pérez',
            position: 'Soldador',
            managementArea: 'Gerencia de Operaciones',
            currentGesId: gesSoldadores.id,
        },
    });

    // 8. Orden de Examen: AGENDADO
    // Supongamos que se le pide la Batería de Humos
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7)); // Próximo lunes

    await prisma.examOrder.create({
        data: {
            workerId: juanPerez.id,
            companyId: weir.id,
            gesId: gesSoldadores.id,
            examBatteryId: batHumos.id,
            status: OrderStatus.AGENDADO,
            scheduledAt: nextMonday,
            providerName: 'ACHS',
            externalId: 'ORD-ACHS-999',
        },
    });

    console.log('✅ Seed completed successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
