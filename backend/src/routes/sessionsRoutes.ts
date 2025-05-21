import { Router } from 'express';
import { getSessions, createSession } from '../controllers/sessionsController';

const router = Router();

router.get('/', getSessions);
router.post('/', createSession);

export default router; 