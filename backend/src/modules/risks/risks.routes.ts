import { Router } from 'express';
import { getRisks, addProtocol, removeProtocol } from './risks.controller';
import { uploadS3 } from '../../config/upload'; // 👈 Importamos el "Puente" que creamos

const router = Router();

// 1. Listar todos los riesgos
router.get('/', getRisks);

// 2. Subir PDF (Aquí ocurre la magia)
// 'file' es el nombre exacto que le pusimos en el Frontend (formData.append('file', ...))
// uploadS3.single('file') intercepta el archivo y lo manda a Amazon antes de llegar al controlador
router.post('/:id/protocols', uploadS3.single('file'), addProtocol);

// 3. Eliminar PDF
router.delete('/protocols/:protocolId', removeProtocol);

export default router;