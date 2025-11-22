import { Router } from 'express';
import { AreasController } from './areas.controller';

export const areasRouter = Router();

areasRouter.post('/', AreasController.create);
areasRouter.get('/', AreasController.findAll);
areasRouter.get('/:id', AreasController.findById);
areasRouter.put('/:id', AreasController.update);
areasRouter.delete('/:id', AreasController.delete);
