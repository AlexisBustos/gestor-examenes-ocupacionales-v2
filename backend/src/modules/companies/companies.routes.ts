import { Router } from 'express';
import { list, getOne, create, update, remove } from './companies.controller'; // Ya no importamos uploadLogo
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

// Eliminamos la ruta del logo temporalmente para que compile
// router.post('/:id/logo', upload.single('file'), uploadLogo); 

export const companiesRouter = router;
export default router;