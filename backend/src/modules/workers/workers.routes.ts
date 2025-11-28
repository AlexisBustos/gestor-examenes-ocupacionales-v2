import { Router } from 'express';
import * as workersController from './workers.controller';

const router = Router();

router.post('/analyze-transfer', workersController.analyzeTransfer);
router.post('/transfer', workersController.executeTransfer);
router.post('/import', workersController.importWorkers);
router.get('/check/:rut', workersController.checkRut);
router.get('/', workersController.list);
router.get('/:id', workersController.getOne);
router.patch('/:id', workersController.update);
router.delete('/:id', workersController.remove);

export default router;