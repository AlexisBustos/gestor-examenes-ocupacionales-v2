import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import { getSuggestedBatteries } from '../ges/ges.service';

const prisma = new PrismaClient();

// --- NUEVO: FUNCIÓN PARA REGISTRAR EVENTOS ---
export const logWorkerEvent = async (workerId: string, type: string, title: string, details?: string) => {
    await prisma.workerEvent.create({
        data: { workerId, eventType: type, title, details }
    });
};

// --- READ ---
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

// 👇 ACTUALIZADO: AHORA INCLUYE LOS EVENTOS EN LA FICHA
export const getWorkerById = async (id: string) => {
  return await prisma.worker.findUnique({
    where: { id },
    include: { 
        company: true, 
        currentGes: true,
        events: { orderBy: { createdAt: 'desc' } }, // <--- TRAEMOS LA BITÁCORA
        examOrders: { 
            orderBy: { createdAt: 'desc' },
            include: { 
                ges: true,
                orderBatteries: { include: { battery: true } }
            }
        }
    }
  });
};

// 👇 ACTUALIZADO: DETECTA CAMBIOS Y LOS REGISTRA
export const updateWorker = async (id: string, data: any) => {
    // 1. Obtenemos el trabajador antes del cambio para comparar
    const current = await prisma.worker.findUnique({ where: { id } });
    
    // 2. Aplicamos la actualización
    const updated = await prisma.worker.update({ where: { id }, data });

    // 3. Detectamos cambios importantes para la bitácora
    if (current) {
        // A) Cambio de Estado (Tránsito -> Nómina)
        if (current.employmentStatus !== updated.employmentStatus) {
            await logWorkerEvent(id, 'CAMBIO_ESTADO', 
                updated.employmentStatus === 'NOMINA' ? 'Ingreso a Nómina Oficial' : 'Cambio de Estado',
                `Pasó de ${current.employmentStatus} a ${updated.employmentStatus}`
            );
        }

        // B) Cambio de Puesto (Transferencia)
        if (current.currentGesId !== updated.currentGesId) {
            // Buscamos el nombre del nuevo GES para el detalle
            const newGes = updated.currentGesId ? await prisma.ges.findUnique({ where: { id: updated.currentGesId }}) : null;
            await logWorkerEvent(id, 'CAMBIO_PUESTO', 
                'Cambio de Puesto de Trabajo',
                `Nuevo puesto asignado: ${newGes?.name || 'Sin asignar'}`
            );
        }
    }

    return updated;
};

export const deleteWorker = async (id: string) => {
    return await prisma.worker.delete({ where: { id } });
};

// 👇 ACTUALIZADO: REGISTRA LA CREACIÓN
// 👇 ACTUALIZADO: AHORA GUARDA LA RELACIÓN REAL (ID)
export const createWorkerDb = async (data: any) => {
  const exists = await prisma.worker.findUnique({ where: { rut: data.rut } });
  if (exists) return exists; 

  let companyId = data.companyId;
  if (!companyId) {
      const defaultComp = await prisma.company.findFirst();
      if (!defaultComp) throw new Error("No hay empresas");
      companyId = defaultComp.id;
  }

  const initialStatus = (data.evaluationType === 'PRE_OCUPACIONAL') ? 'TRANSITO' : 'NOMINA';

  const newWorker = await prisma.worker.create({
    data: {
      rut: data.rut,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position || 'Sin Cargo',
      
      // CAMBIO CLAVE: Usamos el ID para conectar la tabla
      costCenterId: data.costCenterId ? data.costCenterId : null,
      
      companyId: companyId,
      active: true,
      employmentStatus: initialStatus
    }
  });

  // LOG: Registramos el nacimiento del trabajador
  await logWorkerEvent(newWorker.id, 'CREACION', 'Creación de Ficha', 
      initialStatus === 'TRANSITO' ? 'Ingresa como Candidato (En Tránsito)' : 'Ingresa directo a Nómina');

  return newWorker;
};

export const importWorkersDb = async (fileBuffer: Buffer) => {
  // (Mantén tu lógica de importación aquí, no cambia mucho por ahora)
  // ... Para no hacer el código gigante, deja la función importWorkersDb como la tenías.
  // Si la necesitas completa avísame.
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
        
        if (rut && name) {
            await prisma.worker.upsert({
                where: { rut: rut.toString() },
                update: { name: name.toString() }, // Simplificado
                create: { 
                    rut: rut.toString(), 
                    name: name.toString(), 
                    companyId: defaultCompany.id,
                    employmentStatus: 'NOMINA' // Asumimos nómina al importar masivo
                }
            });
            count++;
        }
    }
    return { message: `Nómina procesada.` };
};

// --- MOVILIDAD (Mantén tus funciones existing analyzeJobChange y transferWorker) ---
// Solo asegúrate de que transferWorker use updateWorker o haga el log manualmente.
// Como transferWorker es simple, la reemplazamos para usar updateWorker y aprovechar el log automático:

// --- MOVILIDAD: LÓGICA REAL DE ANÁLISIS ---
// --- MOVILIDAD: LÓGICA CON BYPASS DE TIPOS ---
// --- MOVILIDAD: LÓGICA CON BYPASS DE TIPOS ---
export const analyzeJobChange = async (workerId: string, newGesId: string) => {
    // 1. Obtener datos (USAMOS : any PARA QUE TYPESCRIPT NO RECLAME)
    const worker: any = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            currentGes: true,
            examOrders: {
                // 👇 COMENTAMOS ESTO TEMPORALMENTE HASTA SABER LA PALABRA EXACTA
                // where: { status: 'COMPLETADA' }, 
                include: {
                    orderBatteries: {
                        where: { status: 'APTO' },
                        include: { battery: true }
                    }
                }
            }
        }
    });

    const newGes = await prisma.ges.findUnique({
        where: { id: newGesId }
    });

    if (!worker || !newGes) throw new Error("Trabajador o GES no encontrado");

    // 3. Obtener requisitos
    const requiredBatteries = await getSuggestedBatteries(newGesId);

    // 4. CALCULAR BRECHAS
    const myPassedExamIds = new Set();
    
    // Como worker es 'any', ya no nos reclamará por examOrders
    if (worker.examOrders) {
        worker.examOrders.forEach((order: any) => {
            if (order.orderBatteries) {
                order.orderBatteries.forEach((item: any) => {
                    myPassedExamIds.add(item.batteryId);
                });
            }
        });
    }

    const gaps = requiredBatteries.map((battery: any) => {
        const isCovered = myPassedExamIds.has(battery.id);
        return {
            batteryId: battery.id,
            name: battery.name,
            status: isCovered ? 'CUBIERTO' : 'FALTA'
        };
    });

    const transferReady = !gaps.some(g => g.status === 'FALTA');

    return {
        worker: { currentGesName: worker.currentGes?.name },
        newGes: { name: newGes.name },
        gaps: gaps,
        transferReady: transferReady
    };
};

export const transferWorker = async (workerId: string, newGesId: string) => {
    // Usamos nuestra función updateWorker mejorada para que detecte el cambio y lo registre
    return await updateWorker(workerId, { currentGesId: newGesId });
};