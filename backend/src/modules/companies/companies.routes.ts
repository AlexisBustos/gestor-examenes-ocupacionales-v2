import { Router } from 'express';
import { list, getOne, create, update, remove } from './companies.controller';

const router = Router();

// Definir las rutas y conectarlas a las funciones del controlador
router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

// Exportamos con nombre para que coincida con routes.ts
export const companiesRouter = router;