import { PrismaClient, EvaluationType, UserRole, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- DICCIONARIO MÉDICO COMPLETO ---
const PROTOCOLOS = [
  { agente: "Ruido", bateria: "Protocolo RUIDO (Prexor)", examenes: ["Encuesta de salud", "Enfermería", "Audiometría en cámara", "Consulta médica"] },
  { agente: "Sílice", bateria: "Protocolo SÍLICE (Neumoconiosis)", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "Rx Tórax AP con técnica OIT", "Lectura OIT", "Consulta médica"] },
  { agente: "Plaguicidas", bateria: "Protocolo PLAGUICIDAS", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "Creatinina", "SGOT", "SGPT", "Protrombina", "Actividad de acetilcolinesterasa plasmática", "Consulta médica"] },
  { agente: "Citostáticos", bateria: "Protocolo CITOSTÁTICOS", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "GPT/SGPT", "Consulta médica"] },
  { agente: "Arsénico", bateria: "Protocolo ARSÉNICO", examenes: ["Encuesta de salud", "Enfermería", "Arsénico inorgánico en orina", "Creatinina", "GPT/SGPT", "Consulta médica"] },
  { agente: "Plomo", bateria: "Protocolo PLOMO", examenes: ["Encuesta de salud", "Enfermería", "Hemoglobina", "SGPT", "Protrombina", "Creatinina", "Plomo en sangre", "Consulta médica"] },
  { agente: "Cromo", bateria: "Protocolo CROMO", examenes: ["Encuesta de salud", "Enfermería", "Espirometría", "Radiografía de tórax", "Creatinina", "SGPT", "Cromo en orina", "Consulta médica"] },
  { agente: "Manganeso", bateria: "Protocolo MANGANESO", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "FA (Fosfatasa Alcalina)", "GGT", "Hemoglobina", "Manganeso en orina", "Consulta médica"] },
  { agente: "Asma", bateria: "Protocolo ASMA OCUPACIONAL", examenes: ["Encuesta de salud", "Enfermería", "Optometría", "Hemograma completo", "Recuento de reticulocitos", "Consulta médica"] },
  { agente: "Radiaciones Ionizantes", bateria: "Protocolo RADIACIONES IONIZANTES", examenes: ["Encuesta de salud", "Enfermería", "Espirometría completa", "Consulta médica"] },
  { agente: "Vibraciones", bateria: "Protocolo VIBRACIONES (Osteomuscular)", examenes: ["Encuesta de salud", "Consulta médica", "Rx Columna", "Evaluación Musculoesquelética"] },
  { agente: "Solventes", bateria: "Protocolo SOLVENTES General", examenes: ["Encuesta de salud", "Enfermería", "Hemograma", "Perfil Hepático", "Consulta médica"] },
  { agente: "Humos Metálicos", bateria: "Protocolo HUMOS METÁLICOS", examenes: ["Encuesta de salud", "Espirometría basal", "Rx Tórax AP con técnica OIT", "Consulta médica"] },
  { agente: "Trabajo en Altura Geográfica", bateria: "Protocolo ALTURA GEOGRÁFICA", examenes: ["Encuesta de salud", "Enfermería", "Electrocardiograma de Reposo (ECG)", "Glicemia", "Creatinina", "Consulta médica"] },
  { agente: "Trabajo en Altura Física", bateria: "Protocolo ALTURA FÍSICA", examenes: ["Encuesta de salud", "Enfermería", "Electrocardiograma de Reposo (ECG)", "Glicemia", "Visiometría", "Consulta médica"] },
  { agente: "Estrés Térmico Calor", bateria: "Protocolo ESTRÉS TÉRMICO", examenes: ["Encuesta de salud", "Enfermería", "Creatinina", "Electrolitos plasmáticos", "Consulta médica"] }
];

async function main() {
  console.log('🌱 Iniciando Restauración del Sistema...');

  // 1. LIMPIEZA (Intentamos borrar todo)
  try {
    await prisma.examOrder.deleteMany();
    await prisma.riskExposure.deleteMany();
    await prisma.batteryExam.deleteMany();
    await prisma.examBattery.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.ges.deleteMany();
    await prisma.area.deleteMany();
    await prisma.workCenter.deleteMany();
    await prisma.company.deleteMany();
    await prisma.riskAgent.deleteMany();
    await prisma.medicalExam.deleteMany();
    // NO borramos la tabla User aquí para usar upsert abajo
  } catch (e) { console.log('Limpieza parcial.'); }

  // 2. RESCATAR USUARIO ADMIN (Lógica Blindada) 🛡️
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@vitam.cl' },
    update: { 
        password: hashedPassword, // Si existe, LE RESETEA LA CLAVE
        role: UserRole.ADMIN_VITAM 
    }, 
    create: {
      email: 'admin@vitam.cl',
      password: hashedPassword,
      name: 'Administrador Vitam',
      role: UserRole.ADMIN_VITAM,
    },
  });
  console.log('👤 Admin restaurado: admin@vitam.cl / 123456');

  // 3. CARGA MÉDICA
  for (const proto of PROTOCOLOS) {
    await prisma.riskAgent.upsert({
      where: { name: proto.agente }, update: {}, create: { name: proto.agente }
    });

    const examIds = [];
    for (const nombreExamen of proto.examenes) {
      const ex = await prisma.medicalExam.upsert({ where: { name: nombreExamen }, update: {}, create: { name: nombreExamen } });
      examIds.push(ex.id);
    }

    const bat = await prisma.examBattery.findFirst({ where: { name: proto.bateria } });
    if (!bat) {
      await prisma.examBattery.create({
        data: {
          name: proto.bateria,
          evaluationType: EvaluationType.OCUPACIONAL,
          batteryExams: { create: examIds.map(id => ({ medicalExamId: id })) }
        }
      });
    }
  }

  // 4. EMPRESA BASE
  await prisma.company.create({
    data: { rut: '99.999.999-9', name: 'EMPRESA DEMO VACIA', contactEmail: 'demo@vitam.cl' }
  });

  console.log('✅ Sistema listo y desbloqueado.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });