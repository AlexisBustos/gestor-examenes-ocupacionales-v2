import { Router } from 'express';
import multer from 'multer';
import { list, getOne, create, uploadReport, getSuggestions, getAreaSuggestions } from './ges.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/batteries', getSuggestions); // Por GES
router.get('/area/:id/batteries', getAreaSuggestions); // 👇 NUEVO: Por Área
router.post('/', create);
router.post('/:id/report', upload.single('file'), uploadReport);

export default router;