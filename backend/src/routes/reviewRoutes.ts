import { Router } from 'express';
import { getAllReviews, getReviewsByUser, createReview, deleteReview, updateReview } from '../controllers/reviewController';

const router = Router();

router.get('/api/reviews', getAllReviews);
router.get('/api/reviews/user/:userId', getReviewsByUser);
router.post('/api/reviews', createReview);
router.delete('/api/reviews/:reviewId', deleteReview);
router.put('/api/reviews/:reviewId', updateReview);

export default router; 