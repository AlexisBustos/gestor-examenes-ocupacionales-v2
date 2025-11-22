import { Router } from 'express';
import { WorkCentersController } from './work-centers.controller';

export const workCentersRouter = Router();

workCentersRouter.post('/', WorkCentersController.create);
workCentersRouter.get('/', WorkCentersController.findAll);
workCentersRouter.get('/:id', WorkCentersController.findById);
workCentersRouter.put('/:id', WorkCentersController.update);
workCentersRouter.delete('/:id', WorkCentersController.delete);
