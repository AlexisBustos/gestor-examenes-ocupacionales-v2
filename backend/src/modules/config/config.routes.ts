import { Router } from 'express';
import multer from 'multer';
import { importRules, getRules, createRule, deleteRule } from './config.controller';
// Importamos el servicio de baterías para usarlo aquí
import { findAllBatteries } from '../batteries/batteries.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/rules', getRules);
router.post('/rules', createRule);
router.delete('/rules/:id', deleteRule);
router.post('/import-rules', upload.single('file'), importRules);

// 👇 RUTA NUEVA PARA EL SELECTOR
router.get('/batteries', async (req, res) => {
    try {
        const batteries = await findAllBatteries();
        res.json(batteries);
    } catch (e) { res.status(500).json({ error: 'Error al listar baterías' }); }
});

export default router;