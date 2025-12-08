import { Router } from 'express';
// Importamos todas las funciones del controlador, incluidas las nuevas para subir informes
import { list, getOne, create, update, remove, uploadQualitative, uploadQuantitative } from './companies.controller'; 
import { uploadS3 } from '../../config/upload'; // 👈 Importamos el puente S3
import { removeTechnicalReport, removeQuantitativeReport } from './companies.controller';

const router = Router();

// CRUD Básico
router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

// 👇 RUTAS NUEVAS PARA SUBIR INFORMES A S3
// Subir Informe CUALITATIVO (TechnicalReport)
router.post('/:id/qualitative', uploadS3.single('file'), uploadQualitative);

// Subir Informe CUANTITATIVO (QuantitativeReport)
// Necesitamos companyId en la URL, pero también technicalReportId en el body
router.post('/:id/quantitative', uploadS3.single('file'), uploadQuantitative);

router.delete('/:id/qualitative/:reportId', removeTechnicalReport);
router.delete('/:id/quantitative/:reportId', removeQuantitativeReport);

export const companiesRouter = router;
export default router;