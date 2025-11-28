import { Router } from 'express';
import { list, create, remove } from './batteries.controller';

const router = Router();

router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

export default router;