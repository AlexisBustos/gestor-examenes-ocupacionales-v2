import { Router } from 'express';
import multer from 'multer';
import { list, getOne, create, uploadReport, getSuggestions, getAreaSuggestions } from './ges.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/batteries', getSuggestions);
router.get('/area/:id/batteries', getAreaSuggestions);
router.post('/', create);
router.post('/:id/report', upload.single('file'), uploadReport);

// 👇 ESTO ES LO QUE PERMITE IMPORTAR SIN LLAVES
export default router;