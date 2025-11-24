import { Request, Response } from 'express';
import { createCompany, deleteCompany, getAllCompanies, getCompanyById, updateCompany } from './companies.service';

// Listar
export const list = async (req: Request, res: Response) => {
  try {
    const companies = await getAllCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar empresas' });
  }
};

// Obtener UNA (Con stats)
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

// Crear
export const create = async (req: Request, res: Response) => {
  try {
    const company = await createCompany(req.body);
    res.status(201).json(company);
  } catch (error: any) {
    // Manejo de error de duplicados (P2002)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una empresa con ese RUT' });
    }
    res.status(400).json({ error: 'Error al crear empresa' });
  }
};

// Actualizar
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await updateCompany(id, req.body);
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar empresa' });
  }
};

// Eliminar
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