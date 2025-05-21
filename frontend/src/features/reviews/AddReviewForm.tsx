import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { submitReview, markSessionReviewed } from './reviewsSlice';

interface AddReviewFormProps {
  revieweeId: string;
  revieweeName: string;
  sessionId: string;
  skill: string;
  onSuccess?: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ 
  revieweeId, 
  revieweeName, 
  sessionId, 
  skill,
  onSuccess 
}) => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile);
  const { reviews, loading, pendingReviews } = useAppSelector((state) => state.reviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Check if session is eligible for review
  const isEligibleForReview = pendingReviews.includes(sessionId);

  // Prevent duplicate reviews for the same session by the same reviewer
  const alreadyReviewed = reviews.some(
    (r) => r.sessionId === sessionId && r.reviewerId === (profile.email || 'me')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      const result = await dispatch(submitReview({
        reviewerId: profile.email || 'me',
        reviewerName: profile.name || 'Me',
        revieweeId,
        revieweeName,
        sessionId,
        skill,
        rating,
        comment: comment.trim(),
      })).unwrap();
      
      setComment('');
      setRating(5);
      setSuccess('Review submitted successfully!');
      setError('');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      setSuccess('');
    }
  };

  if (alreadyReviewed) {
    return (
      <div className="bg-green-50 p-4 rounded shadow border mt-4 text-green-700 text-sm">
        You have already submitted a review for this session.
      </div>
    );
  }

  if (!isEligibleForReview && !alreadyReviewed) {
    return (
      <div className="bg-yellow-50 p-4 rounded shadow border mt-4 text-yellow-700 text-sm">
        This session is not eligible for review. Only completed sessions can be reviewed.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow border mt-4">
      <div className="mb-2 font-semibold text-gray-800">Leave a Review</div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-700">Rating:</span>
        {[1,2,3,4,5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => setRating(star)}
            aria-label={`Set rating to ${star}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={3}
        placeholder="Write your review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />
      <button
        type="submit"
        className={`w-full py-2 rounded transition ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        disabled={loading || !comment.trim()}
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
      
      {success && <div className="text-green-600 mt-2 text-sm">{success}</div>}
      {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
    </form>
  );
};

export default AddReviewForm; 