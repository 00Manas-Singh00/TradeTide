import { Router } from 'express';
import requireAuth from '../middleware/requireAuth';
import { listUsers } from '../controllers/marketplaceController';

const router = Router();

router.use(requireAuth);

// GET /api/marketplace/users - list/search users
router.get('/users', listUsers as any);

export default router; 