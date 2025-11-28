import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

// Listar Reglas
export const getRulesDb = async () => {
    return await prisma.medicalRule.findMany({
        include: { battery: true },
        orderBy: { riskAgentName: 'asc' }
    });
};

// Crear Regla Manual
export const createRuleDb = async (data: { agent: string; detail?: string; batteryId: string }) => {
    return await prisma.medicalRule.create({
        data: {
            riskAgentName: data.agent,
            specificDetail: data.detail || null,
            batteryId: data.batteryId
        }
    });
};

// Borrar Regla
export const deleteRuleDb = async (id: string) => {
    return await prisma.medicalRule.delete({ where: { id } });
};

// Importar Excel (Mejorado con logs)
export const importRulesDb = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  console.log(`📥 Procesando ${rows.length} filas del Excel de Reglas...`);

  // Borramos reglas viejas para una carga limpia
  await prisma.medicalRule.deleteMany();

  let count = 0;

  for (const row of rows) {
    const clean: any = {};
    Object.keys(row).forEach(k => clean[k.toLowerCase().trim()] = row[k]);

    const agente = clean['agente'] || clean['riesgo'] || clean['risk'];
    const detalle = clean['detalle'] || clean['especifico'] || clean['detail'];
    const bateriaNombre = clean['bateria'] || clean['protocolo'] || clean['battery'];

    if (agente && bateriaNombre) {
      // Buscamos la batería por nombre (flexible)
      const battery = await prisma.examBattery.findFirst({
        where: { name: { contains: bateriaNombre.toString(), mode: 'insensitive' } }
      });

      if (battery) {
        await prisma.medicalRule.create({
          data: {
            riskAgentName: agente.toString(),
            specificDetail: detalle ? detalle.toString() : null,
            batteryId: battery.id
          }
        });
        count++;
      } else {
          console.warn(`⚠️ Batería no encontrada para: ${bateriaNombre}`);
      }
    }
  }
  return { message: `Reglas importadas exitosamente: ${count}` };
};

// Helper: Listar Baterías (Para el combo de creación manual)
export const getAllBatteriesDb = async () => {
    return await prisma.examBattery.findMany({ orderBy: { name: 'asc' } });
};