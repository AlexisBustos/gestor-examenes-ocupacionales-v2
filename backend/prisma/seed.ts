import { PrismaClient, EvaluationType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// NOMBRES ESTANDARIZADOS (EN MAYÚSCULAS PARA FACILITAR MATCH)
const PROTOCOLOS = [
  // --- RUIDO ---
  { agente: "Ruido", bateria: "Protocolo RUIDO (Prexor)", examenes: ["Audiometría", "Consulta médica"] },
  
  // --- SÍLICE ---
  { agente: "Sílice", bateria: "Protocolo SÍLICE (Planesi)", examenes: ["Espirometría", "Rx Tórax", "Encuesta Salud"] },

  // --- SOLVENTES (Específicos y General) ---
  { agente: "Tolueno", bateria: "Protocolo SOLVENTES - TOLUENO", examenes: ["Orina Tolueno", "Hemograma"] },
  { agente: "Xileno", bateria: "Protocolo SOLVENTES - XILENO", examenes: ["Ácido Metilhipúrico", "Hemograma"] },
  { agente: "Hexano", bateria: "Protocolo SOLVENTES - HEXANO", examenes: ["2,5 Hexanodiona", "Perfil Hepático"] },
  { agente: "Solventes", bateria: "Protocolo SOLVENTES (General)", examenes: ["Perfil Hepático", "Hemograma"] },
  
  // --- METALES (Específicos y General) ---
  { agente: "Manganeso", bateria: "Protocolo METALES - MANGANESO", examenes: ["Manganeso Orina", "Evaluación Neurológica", "Hemograma"] },
  { agente: "Plomo", bateria: "Protocolo METALES - PLOMO", examenes: ["Plomo Sangre", "Hemoglobina", "Creatinina"] },
  { agente: "Arsénico", bateria: "Protocolo METALES - ARSÉNICO", examenes: ["Arsénico Orina", "Examen Físico"] },
  { agente: "Cromo", bateria: "Protocolo METALES - CROMO", examenes: ["Cromo Orina", "Espirometría"] },
  // Hierro y Humos van a la genérica
  { agente: "Humos Metálicos", bateria: "Protocolo HUMOS METÁLICOS", examenes: ["Espirometría", "Rx Tórax"] },

  // --- OTROS ---
  { agente: "Vibraciones", bateria: "Protocolo VIBRACIONES", examenes: ["Rx Columna", "Eval. Musculoesquelética"] },
  { agente: "Radiación UV", bateria: "Protocolo RADIACIÓN UV SOLAR", examenes: ["Eval. Piel", "Oftalmología"] },
  { agente: "Estrés Térmico", bateria: "Protocolo ESTRÉS TÉRMICO", examenes: ["Creatinina", "Electrolitos"] },
  { agente: "Plaguicidas", bateria: "Protocolo PLAGUICIDAS", examenes: ["Colinesterasa", "Hemograma"] },
  { agente: "Altura Física", bateria: "Protocolo ALTURA FÍSICA", examenes: ["Glicemia", "ECG", "Visiometría"] },
  { agente: "Altura Geográfica", bateria: "Protocolo ALTURA GEOGRÁFICA", examenes: ["Glicemia", "ECG", "Hemoglobina"] },
];

async function main() {
  console.log('🌱 Re-calibrando Base de Datos Médica...');

  // Limpieza de baterías para evitar duplicados viejos
  try {
      await prisma.orderBattery.deleteMany(); // Limpiamos referencias en órdenes
      await prisma.batteryExam.deleteMany();
      await prisma.examBattery.deleteMany();
      // No borramos empresas ni trabajadores
  } catch(e) {}

  // Asegurar Admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@vitam.cl' },
    update: {},
    create: { email: 'admin@vitam.cl', password: hashedPassword, name: 'Admin', role: UserRole.ADMIN_VITAM }
  });

  // Cargar Protocolos
  for (const proto of PROTOCOLOS) {
    // Upsert del riesgo (si no existe lo crea)
    await prisma.riskAgent.upsert({ where: { name: proto.agente }, update: {}, create: { name: proto.agente } });
    
    const examIds = [];
    for (const exName of proto.examenes) {
      const ex = await prisma.medicalExam.upsert({ where: { name: exName }, update: {}, create: { name: exName } });
      examIds.push(ex.id);
    }

    // Crear Batería
    await prisma.examBattery.create({
      data: {
        name: proto.bateria,
        evaluationType: EvaluationType.OCUPACIONAL,
        batteryExams: { create: examIds.map(id => ({ medicalExamId: id })) }
      }
    });
  }

  console.log('✅ Baterías Específicas Cargadas.');
}

main().catch(e => process.exit(1)).finally(async () => await prisma.$disconnect());