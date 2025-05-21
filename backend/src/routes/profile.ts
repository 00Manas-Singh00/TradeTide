import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import requireAuth from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

// GET /api/profile - get current user's profile
router.get('/', getProfile);

// PUT /api/profile - update current user's profile
router.put('/', updateProfile);

export default router; 