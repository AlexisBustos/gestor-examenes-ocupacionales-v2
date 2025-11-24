import { Router } from 'express';
import multer from 'multer';
import { list, getOne, create, uploadReport, getSuggestions } from './ges.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', list);
router.get('/:id', getOne);

// 👇 LA RUTA DE LA MAGIA
router.get('/:id/batteries', getSuggestions); 

router.post('/', create);
router.post('/:id/report', upload.single('file'), uploadReport);

export const gesRouter = router;