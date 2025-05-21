import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as reviewsApi from './reviewsApi';

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
  verified: boolean; // Whether this review is from a verified session
}

export interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  pendingReviews: string[]; // Session IDs that are pending review
}

const initialState: ReviewsState = {
  reviews: [],
  loading: false,
  error: null,
  pendingReviews: [],
};

// Async thunks for API integration
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (userId: string | undefined, { rejectWithValue }) => {
    try {
      if (!userId) throw new Error('No userId provided');
      return await reviewsApi.fetchReviews(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reviews');
    }
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async (review: Omit<Review, 'id' | 'createdAt' | 'verified'>, { rejectWithValue }) => {
    try {
      return await reviewsApi.submitReview(review);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit review');
    }
  }
);

export const fetchPendingReviews = createAsyncThunk(
  'reviews/fetchPendingReviews',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await reviewsApi.fetchPendingReviews(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pending reviews');
    }
  }
);

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
    markSessionReviewed(state, action: PayloadAction<string>) {
      state.pendingReviews = state.pendingReviews.filter(id => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload as Review[];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Submit review
      .addCase(submitReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews.unshift(action.payload as Review);
        // Remove from pending reviews
        state.pendingReviews = state.pendingReviews.filter(
          id => (action.payload as Review).sessionId !== id
        );
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch pending reviews
      .addCase(fetchPendingReviews.fulfilled, (state, action) => {
        state.pendingReviews = action.payload as string[];
      });
  },
});

export const { addReview, clearReviews, markSessionReviewed } = reviewsSlice.actions;
export default reviewsSlice.reducer; 