import xlsx from 'xlsx';
import { PrismaClient, ExposureType } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeKey = (key: string) => {
  return key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
};

export const processExcel = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[] = xlsx.utils.sheet_to_json(sheet);

  if (rawRows.length === 0) throw new Error("El archivo Excel está vacío.");

  let stats = { companies: 0, ges: 0, risks: 0, batteries_linked: 0 };

  console.log("🚨 --- INICIO CARGA MULTI-DETALLE --- 🚨");

  // ESTRATEGIA: Primero limpiamos riesgos de los GES que vamos a tocar
  // (Para evitar duplicados si re-subes el archivo, pero manteniendo la lógica de filas múltiples)
  // ... Por seguridad en esta versión, haremos UPSERT inteligente fila por fila.

  for (const rawRow of rawRows) {
    const row: any = {};
    Object.keys(rawRow).forEach(key => row[normalizeKey(key)] = rawRow[key]);

    const nombreEmpresa = row['empresa'];
    const nombreGes = row['ges'];
    const listaAgentes = row['agentes'] || row['riesgos'] || row['agente'];
    // Capturamos el detalle específico y el tipo de esta fila
    const agenteEspecifico = row['agenteespecifico'] || row['detalle'] || '';
    const tipoExposicionRaw = (row['tipoexposicion'] || row['tipo'] || '').toString().toUpperCase();
    const subArea = row['subarea'] || row['seccion'];

    if (!nombreEmpresa || !nombreGes) continue;

    // 1. Jerarquía (Empresa -> Centro -> Área)
    const company = await prisma.company.upsert({
      where: { rut: `RUT-${nombreEmpresa.replace(/\s+/g, '').toUpperCase()}` },
      update: {},
      create: { name: nombreEmpresa, rut: `RUT-${nombreEmpresa.replace(/\s+/g, '').toUpperCase()}`, contactEmail: 'x' }
    });

    let workCenter = await prisma.workCenter.findFirst({ where: { name: row['centro'] || 'Centro Principal', companyId: company.id } });
    if (!workCenter) workCenter = await prisma.workCenter.create({ data: { name: row['centro'] || 'Centro Principal', companyId: company.id } });

    let area = await prisma.area.findFirst({ where: { name: row['area'] || 'Área General', workCenterId: workCenter.id } });
    if (!area) area = await prisma.area.create({ data: { name: row['area'] || 'Área General', workCenterId: workCenter.id } });

    // 2. GES
    let ges = await prisma.ges.findFirst({ where: { name: nombreGes, areaId: area.id } });
    const gesData = {
      name: nombreGes,
      areaId: area.id,
      tasksDescription: row['descripciontareas'] || '',
      subArea: subArea || null,
      reportDate: new Date(),
      reportNumber: 'IMP-AUTO',
      menCount: 0, womenCount: 0
    };

    if (ges) {
      // Si ya existe, actualizamos info general (pero no borramos riesgos aún)
      ges = await prisma.ges.update({ where: { id: ges.id }, data: { 
          tasksDescription: gesData.tasksDescription,
          subArea: gesData.subArea 
      }});
    } else {
      ges = await prisma.ges.create({ data: gesData });
      stats.ges++;
    }

    // 3. RIESGOS (Lógica Acumulativa)
    if (listaAgentes) {
      // Separamos por si vienen varios en una celda, aunque lo ideal es 1 por fila
      const agentesArray = listaAgentes.toString().split(/[,;\n]+/).map((s: string) => s.trim());

      for (const nombreAgente of agentesArray) {
        if (!nombreAgente || nombreAgente.length < 2) continue;

        // A. Buscar Riesgo Global
        const riskAgent = await prisma.riskAgent.upsert({
            where: { name: nombreAgente },
            update: {},
            create: { name: nombreAgente }
        });

        // B. Buscar Batería (Inteligencia)
        const bateriaSugerida = await prisma.examBattery.findFirst({
            where: { name: { contains: nombreAgente, mode: 'insensitive' } }
        });

        // C. Mapear Tipo
        let exposureType: ExposureType | null = null;
        if (tipoExposicionRaw.includes('CRONI')) exposureType = ExposureType.CRONICA;
        else if (tipoExposicionRaw.includes('AGUD')) exposureType = ExposureType.AGUDA;
        else if (tipoExposicionRaw.includes('INTER')) exposureType = ExposureType.INTERMITENTE;
        else if (tipoExposicionRaw.includes('CONT')) exposureType = ExposureType.CONTINUA;

        // D. UPSERT ESPECÍFICO (La solución al problema)
        // Buscamos si YA existe este riesgo CON este detalle específico
        const existingExposure = await prisma.riskExposure.findFirst({
            where: {
                gesId: ges.id,
                riskAgentId: riskAgent.id,
                specificAgentDetails: agenteEspecifico // <--- Clave: Buscamos por detalle exacto
            }
        });

        if (existingExposure) {
            // Actualizamos si cambió el tipo
            await prisma.riskExposure.update({
                where: { id: existingExposure.id },
                data: { exposureType, specificAgentDetails: agenteEspecifico }
            });
        } else {
            // Creamos NUEVO registro (así acumulamos Tolueno, Xileno, etc.)
            await prisma.riskExposure.create({
                data: {
                    gesId: ges.id,
                    riskAgentId: riskAgent.id,
                    specificAgentDetails: agenteEspecifico,
                    exposureType: exposureType,
                    examBatteries: bateriaSugerida ? { connect: { id: bateriaSugerida.id } } : undefined
                }
            });
            stats.risks++;
            if (bateriaSugerida) stats.batteries_linked++;
        }
      }
    }
  }

  return { message: 'Carga con detalle específico completada', stats };
};