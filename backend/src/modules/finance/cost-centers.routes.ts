import { Router } from 'express';
import multer from 'multer';
import * as costCentersController from './cost-centers.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Guardar en memoria temporal

router.get('/', costCentersController.getCostCenters);
router.post('/', costCentersController.createCostCenter);
router.delete('/:id', costCentersController.deleteCostCenter);

// 👇 RUTA DE IMPORTACIÓN
router.post('/import', upload.single('file'), costCentersController.importCostCenters);

export default router;