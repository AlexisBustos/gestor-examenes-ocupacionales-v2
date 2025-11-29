import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

export const getRulesDb = async () => {
  return await prisma.medicalRule.findMany({
    include: { battery: true },
    orderBy: { riskAgentName: 'asc' }
  });
};

// Ahora acepta batteryId explícito
export const createRuleDb = async (data: { riskAgentName: string, specificDetail?: string, batteryId: string }) => {
  return await prisma.medicalRule.create({
    data: {
      riskAgentName: data.riskAgentName,
      specificDetail: data.specificDetail || null,
      batteryId: data.batteryId
    }
  });
};

export const deleteRuleDb = async (id: string) => {
  return await prisma.medicalRule.delete({ where: { id } });
};

export const importRulesDb = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  await prisma.medicalRule.deleteMany();
  let count = 0;

  for (const row of rows) {
    const clean: any = {};
    Object.keys(row).forEach(k => clean[k.toLowerCase().trim()] = row[k]);

    const agente = clean['agente'] || clean['riesgo'];
    const detalle = clean['detalle'] || clean['especifico'];
    const bateriaNombre = clean['bateria'] || clean['protocolo'];

    if (agente && bateriaNombre) {
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
      }
    }
  }
  return { message: `Reglas importadas: ${count}` };
};