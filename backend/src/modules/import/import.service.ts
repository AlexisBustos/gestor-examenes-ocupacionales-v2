import xlsx from 'xlsx';
import { PrismaClient, ExposureType } from '@prisma/client';

const prisma = new PrismaClient();

// Función auxiliar para limpiar textos (quita tildes y espacios extra)
const normalizeText = (text: string) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Función auxiliar para normalizar claves del objeto (columnas del excel)
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

  console.log("🚨 --- INICIO CARGA MULTI-DETALLE MEJORADA --- 🚨");

  for (const rawRow of rawRows) {
    const row: any = {};
    // Normalizamos las claves para que "Agente Específico" sea igual a "agenteespecifico"
    Object.keys(rawRow).forEach(key => row[normalizeKey(key)] = rawRow[key]);

    // 🛡️ LIMPIEZA 1: Quitamos espacios al principio y final del nombre de la empresa
    let nombreEmpresa = row['empresa'] ? row['empresa'].toString().trim() : '';
    
    // Buscamos 'ges', 'puesto' o 'cargo' como nombre del GES
    const nombreGes = row['ges'] || row['puesto'] || row['cargo'];
    
    // Buscamos 'agente', 'riesgo' o 'agentes'
    const listaAgentes = row['agentes'] || row['riesgos'] || row['agente'];
    
    const agenteEspecifico = row['agenteespecifico'] || row['detalle'] || row['especifico'] || '';
    const tipoExposicionRaw = (row['tipoexposicion'] || row['tipo'] || '').toString().toUpperCase();
    const subArea = row['subarea'] || row['seccion'];
    const descTareas = row['descripciontareas'] || row['descripcion'] || row['tareas'];

    // Si no hay empresa, usamos una por defecto para no perder la data
    let currentCompanyId = '';
    
    if (nombreEmpresa) {
        // 🔥 ARREGLO INTELIGENTE:
        // 1. Primero buscamos por NOMBRE (ignorando mayúsculas/minúsculas)
        // Esto evita duplicados si la empresa ya existe con su RUT real.
        let company = await prisma.company.findFirst({
            where: { 
                name: { equals: nombreEmpresa, mode: 'insensitive' } 
            }
        });

        // 2. Si no existe por nombre, usamos la lógica del RUT Dummy
        if (!company) {
            company = await prisma.company.upsert({
                where: { rut: `RUT-${normalizeText(nombreEmpresa).toUpperCase()}` }, 
                update: {},
                create: { 
                    name: nombreEmpresa, // Ya viene sin espacios gracias al trim() de arriba
                    rut: `RUT-${normalizeText(nombreEmpresa).toUpperCase()}`, 
                    contactEmail: 'admin@empresa.com' 
                }
            });
        }

        currentCompanyId = company.id;
        // Solo contamos como "nueva empresa" si stats es relevante, pero aquí sumamos procesadas
        stats.companies++;

    } else {
        // Fallback: Buscar la primera empresa existente
        const defaultComp = await prisma.company.findFirst();
        if (defaultComp) currentCompanyId = defaultComp.id;
        else {
            // Si no hay nada, creamos una
            const newComp = await prisma.company.create({ data: { name: 'Empresa Principal', rut: '99.999.999-0', contactEmail: 'admin@empresa.com' }});
            currentCompanyId = newComp.id;
        }
    }

    // 1. Jerarquía (Centro -> Área)
    let centroNombre = row['centro'] || row['centrotrabajo'] || 'Casa Matriz';
    centroNombre = centroNombre.toString().trim(); // Limpiamos espacios también aquí

    let workCenter = await prisma.workCenter.findFirst({ where: { name: centroNombre, companyId: currentCompanyId } });
    if (!workCenter) workCenter = await prisma.workCenter.create({ data: { name: centroNombre, companyId: currentCompanyId } });

    let areaNombre = row['area'] || 'Operaciones';
    areaNombre = areaNombre.toString().trim(); // Y aquí

    let area = await prisma.area.findFirst({ where: { name: areaNombre, workCenterId: workCenter.id } });
    if (!area) area = await prisma.area.create({ data: { name: areaNombre, workCenterId: workCenter.id } });

    if (!nombreGes) continue; // Si no hay GES, saltamos a la siguiente fila

    // 2. GES
    let gesNameClean = nombreGes.toString().trim();
    let ges = await prisma.ges.findFirst({ where: { name: gesNameClean, areaId: area.id } });
    
    const gesData = {
      name: gesNameClean,
      areaId: area.id,
      tasksDescription: descTareas || '',
      subArea: subArea || null,
      reportDate: new Date(),
      reportNumber: 'CARGA-MASIVA',
      menCount: 0, womenCount: 0
    };

    if (ges) {
      // Si existe, actualizamos descripción si viene nueva info
      await prisma.ges.update({ 
          where: { id: ges.id }, 
          data: { 
              tasksDescription: descTareas || ges.tasksDescription,
              subArea: subArea || ges.subArea 
          }
      });
    } else {
      ges = await prisma.ges.create({ data: gesData });
      stats.ges++;
    }

    // 3. RIESGOS
    if (listaAgentes) {
      const agentesArray = listaAgentes.toString().split(/[,;\n]+/).map((s: string) => s.trim());

      for (const nombreAgente of agentesArray) {
        if (!nombreAgente || nombreAgente.length < 2) continue;

        // A. Crear Agente Global
        let riskAgent = await prisma.riskAgent.findFirst({
            where: { name: { equals: nombreAgente, mode: 'insensitive' } }
        });

        if (!riskAgent) {
            riskAgent = await prisma.riskAgent.create({ data: { name: nombreAgente } });
        }

        // B. Mapear Tipo de Exposición
        let exposureType: ExposureType | null = null;
        if (tipoExposicionRaw.includes('CRONI')) exposureType = ExposureType.CRONICA;
        else if (tipoExposicionRaw.includes('AGUD')) exposureType = ExposureType.AGUDA;
        else if (tipoExposicionRaw.includes('INTER')) exposureType = ExposureType.INTERMITENTE;
        else if (tipoExposicionRaw.includes('CONT')) exposureType = ExposureType.CONTINUA;

        // C. Vincular al GES
        const specificClean = agenteEspecifico.toString().trim();

        const existingExposure = await prisma.riskExposure.findFirst({
            where: {
                gesId: ges.id,
                riskAgentId: riskAgent.id,
                specificAgentDetails: specificClean 
            }
        });

        if (existingExposure) {
            await prisma.riskExposure.update({
                where: { id: existingExposure.id },
                data: { exposureType }
            });
        } else {
            const bateriaSugerida = await prisma.examBattery.findFirst({
                where: { name: { contains: nombreAgente, mode: 'insensitive' } }
            });

            await prisma.riskExposure.create({
                data: {
                    gesId: ges.id,
                    riskAgentId: riskAgent.id,
                    specificAgentDetails: specificClean,
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

  return { message: 'Carga masiva completada con éxito', stats };
};