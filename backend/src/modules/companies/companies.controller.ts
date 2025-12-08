import { Request, Response } from 'express';
import { 
    createCompany, 
    deleteCompany, 
    getAllCompanies, 
    getCompanyById, 
    updateCompany,
    addTechnicalReportDb,    // Nueva función del servicio
    addQuantitativeReportDb  // Nueva función del servicio
} from './companies.service';

// --- FUNCIONES EXISTENTES (LISTAR, CREAR, ETC.) ---
export const list = async (req: Request, res: Response) => {
  try {
    const companies = await getAllCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar empresas' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await getCompanyById(id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener empresa' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const company = await createCompany(req.body);
    res.status(201).json(company);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una empresa con ese RUT' });
    }
    res.status(400).json({ error: 'Error al crear empresa' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await updateCompany(id, req.body);
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar empresa' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteCompany(id);
    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
};

// 👇 NUEVAS FUNCIONES PARA CARGA DE INFORMES S3 👇

// 1. Subir Informe CUALITATIVO
export const uploadQualitative = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // ID de la empresa
        const { reportNumber, reportDate } = req.body;
        const file = req.file as any; // Viene de S3

        if (!file) return res.status(400).json({ error: 'Falta el archivo PDF' });

        const report = await addTechnicalReportDb({
            companyId: id,
            reportNumber,
            reportDate: new Date(reportDate),
            pdfUrl: file.location // URL de S3
        });

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al subir informe cualitativo' });
    }
};

// 2. Subir Informe CUANTITATIVO
export const uploadQuantitative = async (req: Request, res: Response) => {
    try {
        const { technicalReportId, name, reportDate } = req.body;
        const file = req.file as any;

        if (!file) return res.status(400).json({ error: 'Falta el archivo PDF' });

        const report = await addQuantitativeReportDb({
            technicalReportId,
            name,
            reportDate: new Date(reportDate),
            pdfUrl: file.location // URL de S3
        });

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al subir informe cuantitativo' });
    }
};

import { deleteTechnicalReportDb, deleteQuantitativeReportDb } from './companies.service';

// Eliminar Cualitativo
export const removeTechnicalReport = async (req: Request, res: Response) => {
  try {
    await deleteTechnicalReportDb(req.params.reportId);
    res.json({ message: 'Informe eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar informe' });
  }
};

// Eliminar Cuantitativo
export const removeQuantitativeReport = async (req: Request, res: Response) => {
  try {
    await deleteQuantitativeReportDb(req.params.reportId);
    res.json({ message: 'Informe eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar informe' });
  }
};