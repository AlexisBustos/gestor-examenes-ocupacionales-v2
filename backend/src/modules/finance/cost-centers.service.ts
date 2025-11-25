import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

export const findAllCostCenters = async () => {
  return await prisma.costCenter.findMany({
    orderBy: { name: 'asc' }
  });
};

export const createCostCenterDb = async (data: { code: string; name: string }) => {
  return await prisma.costCenter.create({ data });
};

export const deleteCostCenterDb = async (id: string) => {
  return await prisma.costCenter.delete({ where: { id } });
};

// 👇 LÓGICA DE IMPORTACIÓN MASIVA
export const importCostCentersDb = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  if (rows.length === 0) throw new Error("Archivo vacío");

  let count = 0;

  for (const row of rows) {
    // Normalizar nombres de columnas (para que acepte mayúsculas/minúsculas)
    const cleanRow: any = {};
    Object.keys(row).forEach(k => cleanRow[k.toLowerCase().trim()] = row[k]);

    const code = cleanRow['codigo'] || cleanRow['code'];
    const name = cleanRow['nombre'] || cleanRow['name'] || cleanRow['descripcion'];

    if (code && name) {
      // Upsert: Si existe el código, actualiza el nombre. Si no, crea.
      await prisma.costCenter.upsert({
        where: { code: code.toString() },
        update: { name: name.toString() },
        create: { 
            code: code.toString(), 
            name: name.toString() 
        }
      });
      count++;
    }
  }

  return { message: `Se procesaron ${count} centros de costos` };
};