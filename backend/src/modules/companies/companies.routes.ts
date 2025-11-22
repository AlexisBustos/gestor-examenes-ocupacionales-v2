import { Router } from 'express';
import { CompaniesController } from './companies.controller';

export const companiesRouter = Router();

companiesRouter.post('/', CompaniesController.create);
companiesRouter.get('/', CompaniesController.findAll);
companiesRouter.get('/:id', CompaniesController.findById);
companiesRouter.put('/:id', CompaniesController.update);
companiesRouter.delete('/:id', CompaniesController.delete);
