import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';

const router = Router();

router.get('/api/notifications', getNotifications);
router.put('/api/notifications/:id/read', markNotificationRead);

export default router; 