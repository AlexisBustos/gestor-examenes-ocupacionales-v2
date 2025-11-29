import { Router } from 'express';
import { list, create, remove } from './batteries.controller';

const router = Router();

router.get('/', list);      // GET /api/batteries
router.post('/', create);   // POST /api/batteries
router.delete('/:id', remove); // DELETE /api/batteries/:id

export default router;