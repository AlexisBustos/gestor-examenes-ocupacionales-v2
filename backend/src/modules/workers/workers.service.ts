import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

export const findAllWorkers = async () => {
  return await prisma.worker.findMany({
    orderBy: { name: 'asc' },
    include: { company: true, currentGes: true }
  });
};

export const findWorkerByRut = async (rut: string) => {
  return await prisma.worker.findUnique({
    where: { rut },
    include: { company: true, currentGes: true }
  });
};

// 👇 AQUÍ ESTÁ LA MEJORA PARA LA FICHA
export const getWorkerById = async (id: string) => {
  return await prisma.worker.findUnique({
    where: { id },
    include: { 
        company: true, 
        currentGes: true,
        examOrders: { 
            orderBy: { createdAt: 'desc' },
            include: { 
                ges: true, // Para ver el GES histórico
                orderBatteries: { // Para ver los resultados (Apto/No Apto)
                    include: { battery: true }
                }
            }
        }
    }
  });
};

export const updateWorker = async (id: string, data: any) => {
    return await prisma.worker.update({ where: { id }, data });
};

export const deleteWorker = async (id: string) => {
    return await prisma.worker.delete({ where: { id } });
};

export const importWorkersDb = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  let count = 0;
  const defaultCompany = await prisma.company.findFirst();
  if (!defaultCompany) throw new Error("No hay empresas creadas");

  for (const row of rows) {
    const clean: any = {};
    Object.keys(row).forEach(k => clean[k.toLowerCase().trim()] = row[k]);

    const rut = clean['rut'];
    const name = clean['nombre'] || clean['trabajador'];
    const cargo = clean['cargo'] || clean['puesto'];
    const centroCosto = clean['centro costo'] || clean['cc'];
    const email = clean['email'] || clean['correo'];
    const phone = clean['telefono'] || clean['fono'];

    if (rut && name) {
      await prisma.worker.upsert({
        where: { rut: rut.toString() },
        update: {
            name: name.toString(), position: cargo, costCenter: centroCosto, 
            email: email, phone: phone ? phone.toString() : undefined, active: true 
        },
        create: {
            rut: rut.toString(), name: name.toString(), position: cargo || 'Sin Cargo', 
            costCenter: centroCosto, email: email, phone: phone ? phone.toString() : undefined,
            companyId: defaultCompany.id, active: true
        }
      });
      count++;
    }
  }
  return { message: `Nómina procesada: ${count} trabajadores.` };
};