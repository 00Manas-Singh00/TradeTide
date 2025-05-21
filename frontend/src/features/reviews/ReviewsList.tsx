import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import type { Review } from './reviewsSlice';
import { motion } from 'framer-motion';

interface ReviewsListProps {
  userId: string;
  showHeader?: boolean;
  limit?: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ userId, showHeader = true, limit }) => {
  const reviews = useAppSelector((state) => 
    state.reviews.reviews.filter(r => r.revieweeId === userId)
  );
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Apply limit if provided
  const displayedReviews = limit ? reviews.slice(0, limit) : reviews;

  if (reviews.length === 0) {
    return <div className="text-gray-500 text-sm">No reviews yet.</div>;
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">Reviews ({reviews.length})</div>
          <div className="flex items-center">
            <div className="text-yellow-500 font-bold mr-1">★ {averageRating.toFixed(1)}</div>
            <div className="text-sm text-gray-500">({reviews.length})</div>
          </div>
        </div>
      )}
      
      {displayedReviews.map((review) => (
        <div 
          key={review.id} 
          className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{review.reviewerName}</span>
                {review.verified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()} • {review.skill}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
          </div>
          
          {/* Comment with expand/collapse for long reviews */}
          <div className="text-gray-700">
            {review.comment.length > 150 && !expandedReviewId ? (
              <>
                <div>{review.comment.substring(0, 150)}...</div>
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.96 }}
                  className="text-blue-600 text-sm mt-1 hover:underline"
                  onClick={() => setExpandedReviewId(review.id)}
                >
                  Read more
                </motion.button>
              </>
            ) : (
              <>
                <div>{review.comment}</div>
                {review.comment.length > 150 && expandedReviewId === review.id && (
                  <motion.button
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.96 }}
                    className="text-blue-600 text-sm mt-1 hover:underline"
                    onClick={() => setExpandedReviewId(null)}
                  >
                    Show less
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
      
      {limit && reviews.length > limit && (
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.96 }}
            className="text-blue-600 hover:underline"
          >
            Show all {reviews.length} reviews
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList; 