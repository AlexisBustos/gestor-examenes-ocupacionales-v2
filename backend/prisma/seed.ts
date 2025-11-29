import { PrismaClient, EvaluationType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// LISTA REAL DE BATERÍAS (Extraída de tus documentos)
const BATERIAS_BASE = [
  // Agentes Físicos
  "Protocolo RUIDO (Prexor)",
  "Protocolo VIBRACIONES (Cuerpo Entero)",
  "Protocolo VIBRACIONES (Mano-Brazo)",
  "Protocolo ESTRÉS TÉRMICO (Calor)",
  "Protocolo ESTRÉS TÉRMICO (Frío)",
  "Protocolo RADIACIONES IONIZANTES",
  "Protocolo RADIACIÓN UV SOLAR",
  "Protocolo ILUMINACIÓN",
  "Protocolo HIPOBARÍA (Gran Altura)",
  
  // Agentes Químicos
  "Protocolo SÍLICE (Planesi)",
  "Protocolo POLVOS NO CLASIFICADOS",
  "Protocolo HUMOS METÁLICOS",
  "Protocolo SOLVENTES (General)",
  "Protocolo SOLVENTES - TOLUENO",
  "Protocolo SOLVENTES - XILENO",
  "Protocolo SOLVENTES - HEXANO",
  "Protocolo SOLVENTES - METILETILCETONA (MEK)",
  "Protocolo METALES - MANGANESO",
  "Protocolo METALES - PLOMO",
  "Protocolo METALES - ARSÉNICO",
  "Protocolo METALES - CROMO",
  "Protocolo PLAGUICIDAS",
  "Protocolo CITOSTÁTICOS",
  "Protocolo ASMA OCUPACIONAL",

  // Ergonómicos y Específicos
  "Protocolo MMC (Manejo Manual de Cargas)",
  "Protocolo TMERT (Trastornos Musculoesqueléticos)",
  "Protocolo PVD (Pantalla Visualización Datos)",
  
  // Baterías de Aptitud Específica (Nuevas)
  "Batería ESPACIOS CONFINADOS",
  "Batería ALTURA FÍSICA (Estructural)",
  "Batería ALTURA GEOGRÁFICA (< 3000 msnm)",
  "Batería ALTURA GEOGRÁFICA (> 3000 msnm)",
  "Batería PSICOSENSOTÉCNICA (Maquinaria Pesada)",
  "Batería PSICOSENSOTÉCNICA (Livianos)",
  "Batería CONDUCCIÓN 4X4",
  "Batería BRIGADISTA",
  "Batería GRÚA HORQUILLA / PUENTE",
  
  // Generales
  "Batería PRE-OCUPACIONAL BÁSICA",
  "Batería EXAMEN DE SALIDA"
];

async function main() {
  console.log('🌱 Iniciando Carga Maestra de Datos...');

  // 1. LIMPIEZA DE TABLAS OPERATIVAS (Mantenemos estructura, borramos datos)
  try {
    await prisma.medicalRule.deleteMany(); 
    await prisma.orderBattery.deleteMany();
    // No borramos examBattery aquí para evitar conflictos de ID si ya existen relaciones,
    // el código de abajo maneja duplicados.
  } catch (e) { console.log('Limpieza parcial...'); }

  // 2. ASEGURAR ADMIN
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@vitam.cl' },
    update: { password: hashedPassword, role: UserRole.ADMIN_VITAM },
    create: { email: 'admin@vitam.cl', password: hashedPassword, name: 'Admin', role: UserRole.ADMIN_VITAM }
  });
  console.log('👤 Admin restaurado.');

  // 3. CREAR BATERÍAS (Inteligente: Solo crea si no existe)
  let count = 0;
  for (const nombre of BATERIAS_BASE) {
      // Buscamos si existe (insensible a mayúsculas)
      const exists = await prisma.examBattery.findFirst({
          where: { name: { equals: nombre, mode: 'insensitive' } }
      });

      if (!exists) {
          await prisma.examBattery.create({
              data: {
                  name: nombre,
                  evaluationType: EvaluationType.OCUPACIONAL
              }
          });
          count++;
      }
  }
  console.log(`✅ Se han asegurado ${BATERIAS_BASE.length} baterías en el sistema. (${count} nuevas creadas).`);

  // 4. EMPRESA DEMO (Para pruebas rápidas)
  await prisma.company.upsert({
    where: { rut: '99.999.999-9' },
    update: {},
    create: { rut: '99.999.999-9', name: 'EMPRESA DEMO', contactEmail: 'demo@vitam.cl' }
  });
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });