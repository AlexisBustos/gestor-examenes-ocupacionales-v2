import { Router } from 'express';
import { getUsers, deleteUser } from './user.controller';

const router = Router();

// GET /api/users -> Trae la lista
router.get('/', getUsers);

// DELETE /api/users/:id -> Borra un usuario
router.delete('/:id', deleteUser);

export default router;