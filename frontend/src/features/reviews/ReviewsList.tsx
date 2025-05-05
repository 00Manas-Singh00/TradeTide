import React from 'react';
import { useAppSelector } from '../../hooks';
import type { Review } from './reviewsSlice';

interface ReviewsListProps {
  userId: string;
  showHeader?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ userId, showHeader = true }) => {
  const reviews = useAppSelector((state) => state.reviews.reviews.filter(r => r.revieweeId === userId));

  if (reviews.length === 0) {
    return <div className="text-gray-500 text-sm">No reviews yet.</div>;
  }

  return (
    <div className="space-y-4">
      {showHeader && <div className="font-semibold text-lg mb-2">Reviews</div>}
      {reviews.map((review) => (
        <div key={review.id} className="bg-gray-50 p-4 rounded shadow border">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{review.reviewerName}</span>
            <span className="text-xs text-gray-500">on {new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            ))}
            <span className="ml-2 text-xs text-gray-600">{review.skill}</span>
          </div>
          <div className="text-gray-700 text-sm">{review.comment}</div>
        </div>
      ))}
    </div>
  );
};

export default ReviewsList; 