import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// 1. Cargamos las variables de entorno para conectarnos a la BD real (AWS)
// Buscamos el .env dos carpetas arriba (backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚨 --- INICIANDO LIMPIEZA DE BASE DE DATOS (PRODUCCIÓN) --- 🚨');
  console.log('⏳ Conectando a la base de datos...');

  // El orden es CRÍTICO para no romper relaciones (Foreign Keys)
  
  // 1. Borrar Resultados y Baterías de Órdenes
  console.log('1. Eliminando detalles de exámenes...');
  const deletedBatteries = await prisma.orderBattery.deleteMany({});
  console.log(`   ✅ ${deletedBatteries.count} registros eliminados.`);

  // 2. Borrar las Órdenes de Examen
  console.log('2. Eliminando órdenes médicas...');
  const deletedOrders = await prisma.examOrder.deleteMany({});
  console.log(`   ✅ ${deletedOrders.count} órdenes eliminadas.`);

  // 3. Borrar Historial/Eventos del Trabajador
  console.log('3. Eliminando historial de eventos...');
  const deletedEvents = await prisma.workerEvent.deleteMany({});
  console.log(`   ✅ ${deletedEvents.count} eventos eliminados.`);

  // 4. FINALMENTE: Borrar la Nómina de Trabajadores
  console.log('4. Eliminando trabajadores (Nómina)...');
  const deletedWorkers = await prisma.worker.deleteMany({});
  console.log(`   ✅ ${deletedWorkers.count} trabajadores eliminados.`);

  console.log('-----------------------------------');
  console.log('✨ LIMPIEZA COMPLETADA.');
  console.log('   La estructura base (Empresas, Usuarios, Centros de Costos) está INTACTA.');
}

main()
  .catch((e) => {
    console.error('❌ ERROR FATAL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });