import { Router } from 'express';
import multer from 'multer';
import { list, addProtocol, removeProtocol } from './risks.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', list);
router.post('/:id/protocols', upload.single('file'), addProtocol); 
router.delete('/protocols/:protocolId', removeProtocol); 

export default router;