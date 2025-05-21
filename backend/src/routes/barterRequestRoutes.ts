import { Router } from 'express';
import {
  createBarterRequest,
  getBarterRequests,
  acceptBarterRequest,
  declineBarterRequest,
  deleteBarterRequest,
  completeBarterRequest,
} from '../controllers/barterRequestController';

const router = Router();

router.post('/api/barter-requests', createBarterRequest);
router.get('/api/barter-requests', getBarterRequests);
router.put('/api/barter-requests/:id/accept', acceptBarterRequest);
router.put('/api/barter-requests/:id/decline', declineBarterRequest);
router.put('/api/barter-requests/:id/complete', completeBarterRequest);
router.delete('/api/barter-requests/:id', deleteBarterRequest);

export default router; 