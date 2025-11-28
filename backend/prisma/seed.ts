import { PrismaClient, EvaluationType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// LISTA MAESTRA DE BATERÍAS (Basada en tus documentos)
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
  
  // Agentes Químicos (Polvos)
  "Protocolo SÍLICE (Planesi)",
  "Protocolo POLVOS NO CLASIFICADOS",
  "Protocolo HUMOS METÁLICOS",
  
  // Agentes Químicos (Solventes)
  "Protocolo SOLVENTES (General)",
  "Protocolo SOLVENTES - TOLUENO",
  "Protocolo SOLVENTES - XILENO",
  "Protocolo SOLVENTES - HEXANO",
  "Protocolo SOLVENTES - METILETILCETONA (MEK)",
  "Protocolo SOLVENTES - PERCLOROETILENO",
  "Protocolo SOLVENTES - HEPTANO",

  // Agentes Químicos (Metales)
  "Protocolo METALES (General)",
  "Protocolo METALES - MANGANESO",
  "Protocolo METALES - PLOMO",
  "Protocolo METALES - ARSÉNICO",
  "Protocolo METALES - CROMO",
  "Protocolo METALES - MERCURIO",
  "Protocolo METALES - HIERRO",

  // Otros Agentes
  "Protocolo PLAGUICIDAS",
  "Protocolo CITOSTÁTICOS",
  "Protocolo ASMA OCUPACIONAL",

  // Ergonómicos y Específicos
  "Protocolo MMC (Manejo Manual de Cargas)",
  "Protocolo TMERT (Trastornos Musculoesqueléticos)",
  "Protocolo PVD (Pantalla Visualización Datos)",
  
  // Baterías de Aptitud Específica
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
  console.log('🌱 Restaurando sistema con Baterías Maestras...');

  // 1. LIMPIEZA DE TABLAS MÉDICAS (Para no duplicar)
  try {
    await prisma.medicalRule.deleteMany(); // Reglas de configuración
    await prisma.orderBattery.deleteMany(); // Resultados
    // await prisma.batteryExam.deleteMany(); // (Opcional si tuvieras detalle de exámenes)
    
    // NOTA: No borramos examBattery aquí para no romper IDs existentes si ya tienes órdenes,
    // pero el upsert de abajo se encarga de crear las que falten.
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
  console.log(`✅ Se han asegurado ${BATERIAS_BASE.length} baterías. (${count} nuevas creadas).`);

  // 4. EMPRESA DEMO
  await prisma.company.upsert({
    where: { rut: '99.999.999-9' },
    update: {},
    create: { rut: '99.999.999-9', name: 'EMPRESA DEMO', contactEmail: 'demo@vitam.cl' }
  });
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });