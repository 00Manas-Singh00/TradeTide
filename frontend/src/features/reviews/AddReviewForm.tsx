import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addReview } from './reviewsSlice';

interface AddReviewFormProps {
  revieweeId: string;
  revieweeName: string;
  sessionId: string;
  skill: string;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ revieweeId, revieweeName, sessionId, skill }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.profile);
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState('');

  // Prevent duplicate reviews for the same session by the same reviewer
  const alreadyReviewed = reviews.some(
    (r) => r.sessionId === sessionId && r.reviewerId === (user.email || 'me')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    dispatch(addReview({
      id: Math.random().toString(36).slice(2),
      reviewerId: user.email || 'me',
      reviewerName: user.name || 'Me',
      revieweeId,
      revieweeName,
      sessionId,
      skill,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    }));
    setComment('');
    setRating(5);
    setSuccess('Review submitted!');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (alreadyReviewed) {
    return (
      <div className="bg-gray-100 p-4 rounded shadow border mt-4 text-green-700 text-sm">
        You have already submitted a review for this session.
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
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
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
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        disabled={!comment.trim()}
      >
        Submit Review
      </button>
      {success && <div className="text-green-600 mt-2 text-sm">{success}</div>}
    </form>
  );
};

export default AddReviewForm; 