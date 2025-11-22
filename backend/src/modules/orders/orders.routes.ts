import { Router } from 'express';
import { OrdersController } from './orders.controller';

export const ordersRouter = Router();

ordersRouter.post('/', OrdersController.create);
ordersRouter.get('/', OrdersController.findAll);
ordersRouter.get('/:id', OrdersController.findById);
ordersRouter.patch('/:id/status', OrdersController.updateStatus);
ordersRouter.delete('/:id', OrdersController.delete);
