import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, getUsersAdvanced } from '../controllers/userController';

const router = Router();

router.get('/api/users', getUsersAdvanced);
router.get('/api/users/:id', getUserById);
router.post('/api/users', createUser);
router.put('/api/users/:id', updateUser);

export default router; 