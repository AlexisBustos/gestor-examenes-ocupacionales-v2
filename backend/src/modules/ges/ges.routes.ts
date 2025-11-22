import { Router } from 'express';
import { GesController } from './ges.controller';

export const gesRouter = Router();

gesRouter.post('/', GesController.create);
gesRouter.get('/', GesController.findAll);
gesRouter.get('/:id', GesController.findById);
gesRouter.put('/:id', GesController.update);
gesRouter.delete('/:id', GesController.delete);
