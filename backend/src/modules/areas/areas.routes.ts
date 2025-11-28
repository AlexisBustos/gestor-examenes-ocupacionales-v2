import { Router } from 'express';
import { list, create, update } from './areas.controller';

const router = Router();

router.get('/', list);
router.post('/', create);
router.patch('/:id', update);

export const areasRouter = router;
export default router;