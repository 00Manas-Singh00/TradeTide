import { Router } from 'express';
import { sendBarterRequest, listBarterRequests, acceptBarterRequest, declineBarterRequest } from '../controllers/barterController';

const router = Router();

router.post('/send', sendBarterRequest);
router.get('/list', listBarterRequests);
router.post('/accept', acceptBarterRequest);
router.post('/decline', declineBarterRequest);

export default router; 