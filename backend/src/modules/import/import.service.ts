import xlsx from 'xlsx';
import { PrismaClient, ExposureType } from '@prisma/client';

const prisma = new PrismaClient();

// Función para limpiar nombres de columnas
const normalizeKey = (key: string) => {
  return key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
};

export const processExcel = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[] = xlsx.utils.sheet_to_json(sheet);

  if (rawRows.length === 0) throw new Error("El archivo Excel está vacío.");

  let stats = { companies: 0, ges: 0, risks: 0 };

  console.log("🚨 --- INICIO DEL PROCESO DE IMPORTACIÓN --- 🚨");

  for (const rawRow of rawRows) {
    // 1. Normalizar claves del Excel
    const row: any = {};
    Object.keys(rawRow).forEach(key => row[normalizeKey(key)] = rawRow[key]);

    // 2. Extraer datos clave
    const nombreEmpresa = row['empresa'];
    const nombreGes = row['ges'];
    
    // INTENTAMOS LEER AGENTES DE TODAS LAS FORMAS POSIBLES
    const listaAgentes = row['agentes'] || row['agente'] || row['riesgos'] || row['riesgo'] || row['agentesespecificos'];
    const tipoExposicionRaw = (row['tipoexposicion'] || row['tipo'] || '').toString().toUpperCase();

    if (!nombreEmpresa || !nombreGes) {
        console.log("⚠️ Fila saltada: Falta Empresa o GES");
        continue;
    }

    console.log(`Processing: Empresa=${nombreEmpresa} | GES=${nombreGes}`);

    // A. Empresa
    const company = await prisma.company.upsert({
      where: { rut: `RUT-${nombreEmpresa.replace(/\s+/g, '').toUpperCase()}` },
      update: {},
      create: {
        name: nombreEmpresa,
        rut: `RUT-${nombreEmpresa.replace(/\s+/g, '').toUpperCase()}`,
        contactEmail: 'contacto@importado.cl'
      }
    });
    if (company) stats.companies++;

    // B. Centro y Área (Simplificado para asegurar carga)
    let workCenter = await prisma.workCenter.findFirst({ where: { name: row['centro'] || 'Centro Principal', companyId: company.id } });
    if (!workCenter) workCenter = await prisma.workCenter.create({ data: { name: row['centro'] || 'Centro Principal', companyId: company.id } });

    let area = await prisma.area.findFirst({ where: { name: row['area'] || 'Área General', workCenterId: workCenter.id } });
    if (!area) area = await prisma.area.create({ data: { name: row['area'] || 'Área General', workCenterId: workCenter.id } });

    // C. GES
    let ges = await prisma.ges.findFirst({ where: { name: nombreGes, areaId: area.id } });
    const gesData = {
      name: nombreGes,
      areaId: area.id,
      tasksDescription: row['descripciontareas'] || row['tareas'] || '',
      // Guardamos info extra si viene
      prescriptions: row['medidascontrol'] || '', 
      machineryUsed: row['maquinaria'] || '',
      reportDate: new Date(),
      reportNumber: 'IMP-AUTO',
      menCount: 0, womenCount: 0
    };

    if (ges) {
      ges = await prisma.ges.update({ where: { id: ges.id }, data: gesData });
    } else {
      ges = await prisma.ges.create({ data: gesData });
      stats.ges++;
    }

    // D. PROCESAMIENTO DE RIESGOS (Aquí estaba el problema)
    if (listaAgentes) {
      console.log(`   🔎 Encontrada lista de agentes: "${listaAgentes}"`);
      
      // SEPARADOR UNIVERSAL: Coma, Punto y Coma, o Salto de Línea
      const agentesArray = listaAgentes.toString().split(/[,;\n]+/).map((s: string) => s.trim());

      for (const nombreAgente of agentesArray) {
        if (!nombreAgente || nombreAgente.length < 2) continue;

        console.log(`      -> Procesando Agente: "${nombreAgente}"`);

        // 1. Buscar o Crear Agente (Upsert)
        const riskAgent = await prisma.riskAgent.upsert({
            where: { name: nombreAgente }, // El nombre debe ser único en el schema
            update: {},
            create: { name: nombreAgente }
        });

        // 2. Determinar Tipo
        let exposureType: ExposureType | null = null;
        if (tipoExposicionRaw.includes('CRONI')) exposureType = ExposureType.CRONICA;
        else if (tipoExposicionRaw.includes('AGUD')) exposureType = ExposureType.AGUDA;
        else if (tipoExposicionRaw.includes('INTER')) exposureType = ExposureType.INTERMITENTE;
        else if (tipoExposicionRaw.includes('CONT')) exposureType = ExposureType.CONTINUA;

        // 3. Crear Relación
        // Borramos previa para no duplicar
        await prisma.riskExposure.deleteMany({ where: { gesId: ges.id, riskAgentId: riskAgent.id } });
        
        await prisma.riskExposure.create({
          data: {
            gesId: ges.id,
            riskAgentId: riskAgent.id,
            specificAgentDetails: row['agenteespecifico'] || '',
            exposureType: exposureType,
          }
        });
        stats.risks++;
        console.log(`         ✅ Riesgo vinculado exitosamente.`);
      }
    } else {
        console.log("   ⚠️ NO se encontró columna de agentes en esta fila.");
    }
  }

  console.log("🚨 --- FIN DEL PROCESO --- 🚨");
  return { message: 'Proceso finalizado', stats };
};