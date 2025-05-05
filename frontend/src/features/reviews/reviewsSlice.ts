import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  sessionId: string;
  skill: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface ReviewsState {
  reviews: Review[];
}

const initialState: ReviewsState = {
  reviews: [
    {
      id: 'r1',
      reviewerId: 'u1',
      reviewerName: 'Alice',
      revieweeId: 'u2',
      revieweeName: 'Bob',
      sessionId: 's1',
      skill: 'French Lessons',
      rating: 5,
      comment: 'Great session! Learned a lot.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'r2',
      reviewerId: 'u2',
      reviewerName: 'Bob',
      revieweeId: 'u1',
      revieweeName: 'Alice',
      sessionId: 's1',
      skill: 'Digital Art',
      rating: 4,
      comment: 'Very creative and helpful.',
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 'r3',
      reviewerId: 'u3',
      reviewerName: 'Charlie',
      revieweeId: 'u1',
      revieweeName: 'Alice',
      sessionId: 's2',
      skill: 'Yoga',
      rating: 5,
      comment: 'Relaxing and well-paced session.',
      createdAt: new Date(Date.now() - 21600000).toISOString(),
    },
  ],
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    addReview(state, action: PayloadAction<Review>) {
      state.reviews.unshift(action.payload);
    },
    clearReviews(state) {
      state.reviews = [];
    },
  },
});

export const { addReview, clearReviews } = reviewsSlice.actions;
export default reviewsSlice.reducer; 