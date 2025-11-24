import { PrismaClient, EvaluationType, UserRole, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// DICCIONARIO MÉDICO COMPLETO
const PROTOCOLOS = [
  { agente: "Ruido", bateria: "Evaluación Ocupacional Auditiva PREXOR", examenes: ["Encuesta de salud", "Enfermería", "Audiometría en cámara", "Consulta médica"] },
  { agente: "Sílice", bateria: "Vigilancia de Neumoconiosis (Polvos/Sílice)", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "Rx Tórax AP con técnica OIT", "Lectura OIT", "Consulta médica"] },
  { agente: "Plaguicidas", bateria: "Vigilancia por Intoxicación de Plaguicidas", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "Creatinina", "SGOT", "SGPT", "Protrombina", "Actividad de acetilcolinesterasa plasmática", "Consulta médica"] },
  { agente: "Citostáticos", bateria: "Vigilancia de Exposición a Citostáticos", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "GPT/SGPT", "Consulta médica"] },
  { agente: "Arsénico", bateria: "Biomonitorización de Arsénico", examenes: ["Encuesta de salud", "Enfermería", "Arsénico inorgánico en orina", "Creatinina", "GPT/SGPT", "Consulta médica"] },
  { agente: "Plomo", bateria: "Biomonitorización de Plomo", examenes: ["Encuesta de salud", "Enfermería", "Hemoglobina", "SGPT", "Protrombina", "Creatinina", "Plomo en sangre", "Consulta médica"] },
  { agente: "Cromo", bateria: "Biomonitorización de Cromo", examenes: ["Encuesta de salud", "Enfermería", "Espirometría", "Radiografía de tórax", "Creatinina", "SGPT", "Cromo en orina", "Consulta médica"] },
  { agente: "Manganeso", bateria: "Biomonitorización de Manganeso", examenes: ["Encuesta de salud", "Enfermería", "Espirometría basal", "FA (Fosfatasa Alcalina)", "GGT", "Hemoglobina", "Manganeso en orina", "Consulta médica"] },
  { agente: "Asma", bateria: "Vigilancia Asma Ocupacional", examenes: ["Encuesta de salud", "Enfermería", "Optometría", "Hemograma completo con recuento de plaquetas", "Recuento de reticulocitos", "Consulta médica"] },
  { agente: "Radiaciones Ionizantes", bateria: "Vigilancia Radiológica", examenes: ["Encuesta de salud", "Enfermería", "Espirometría completa", "Consulta médica"] },
  { agente: "Vibraciones", bateria: "Batería Osteomuscular Vibraciones", examenes: ["Encuesta de salud", "Consulta médica", "Evaluación Musculoesquelética"] },
  { agente: "Solventes", bateria: "Batería Solventes General", examenes: ["Encuesta de salud", "Enfermería", "Hemograma", "Perfil Hepático", "Consulta médica"] },
  { agente: "Humos Metálicos", bateria: "Batería Humos Metálicos", examenes: ["Encuesta de salud", "Espirometría basal", "Rx Tórax AP con técnica OIT", "Consulta médica"] },
  { agente: "Trabajo en Altura Geográfica", bateria: "Batería Gran Altura", examenes: ["Encuesta de salud", "Enfermería", "Electrocardiograma de Reposo (ECG)", "Glicemia", "Creatinina", "Consulta médica"] },
  { agente: "Trabajo en Altura Física", bateria: "Batería Altura Física", examenes: ["Encuesta de salud", "Enfermería", "Electrocardiograma de Reposo (ECG)", "Glicemia", "Visiometría", "Consulta médica"] },
  { agente: "Estrés Térmico Calor", bateria: "Protocolo ESTRÉS TÉRMICO", examenes: ["Encuesta de salud", "Enfermería", "Creatinina", "Electrolitos plasmáticos", "Consulta médica"] }
];

async function main() {
  console.log('🌱 Iniciando Limpieza y Carga...');

  // 1. BORRADO TOTAL
  try {
    await prisma.technicalReport.deleteMany();
    await prisma.examOrder.deleteMany();
    await prisma.riskExposure.deleteMany();
    await prisma.batteryExam.deleteMany();
    await prisma.examBattery.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.ges.deleteMany();
    await prisma.area.deleteMany();
    await prisma.workCenter.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.riskAgent.deleteMany();
    await prisma.medicalExam.deleteMany();
  } catch (e) { console.log('Limpieza inicial saltada o parcial.'); }

  // 2. USUARIO ADMIN
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { email: 'admin@vitam.cl', password: hashedPassword, name: 'Admin Vitam', role: UserRole.ADMIN_VITAM },
  });

  // 3. CARGA MÉDICA
  for (const proto of PROTOCOLOS) {
    // Riesgo
    const risk = await prisma.riskAgent.upsert({
      where: { name: proto.agente }, update: {}, create: { name: proto.agente }
    });

    // Exámenes
    const examIds = [];
    for (const exName of proto.examenes) {
      const ex = await prisma.medicalExam.upsert({ where: { name: exName }, update: {}, create: { name: exName } });
      examIds.push(ex.id);
    }

    // Batería (Conectada al Riesgo indirectamente por nombre o lógica futura)
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
  console.log('✅ Sistema reiniciado y listo.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });