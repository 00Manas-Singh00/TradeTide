import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Skill {
  id: string;
  name: string;
}

export interface MarketplaceUser {
  id: string;
  name: string;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  rating: number;
}

export interface BarterRequest {
  userId: string;
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'error';
  direction: 'incoming' | 'outgoing';
}

export interface MarketplaceState {
  users: MarketplaceUser[];
  loading: boolean;
  error: string | null;
  barterRequests: BarterRequest[];
  requestLoading: boolean;
  requestError: string | null;
}

const initialState: MarketplaceState = {
  users: [],
  loading: false,
  error: null,
  barterRequests: [],
  requestLoading: false,
  requestError: null,
};

// Mock async fetch users
export const fetchMarketplaceUsers = createAsyncThunk('marketplace/fetchUsers', async () => {
  await new Promise((res) => setTimeout(res, 1000));
  // Mock user data
  return [
    {
      id: 'u1',
      name: 'Alice',
      skillsOffered: [
        { id: '1', name: 'Digital Art' },
        { id: '3', name: 'Guitar' },
      ],
      skillsWanted: [
        { id: '2', name: 'French Lessons' },
      ],
      rating: 4.8,
    },
    {
      id: 'u2',
      name: 'Bob',
      skillsOffered: [
        { id: '2', name: 'French Lessons' },
      ],
      skillsWanted: [
        { id: '1', name: 'Digital Art' },
        { id: '4', name: 'Web Development' },
      ],
      rating: 4.5,
    },
    {
      id: 'u3',
      name: 'Charlie',
      skillsOffered: [
        { id: '4', name: 'Web Development' },
        { id: '5', name: 'Yoga' },
      ],
      skillsWanted: [
        { id: '3', name: 'Guitar' },
      ],
      rating: 4.9,
    },
  ];
});

// Mock async send barter request
export const sendBarterRequest = createAsyncThunk(
  'marketplace/sendBarterRequest',
  async (userId: string, { rejectWithValue }) => {
    await new Promise((res) => setTimeout(res, 800));
    // Simulate random error
    if (userId === 'u2') return rejectWithValue('Failed to send request');
    return userId;
  }
);

// Mock async accept barter request
export const acceptBarterRequest = createAsyncThunk(
  'marketplace/acceptBarterRequest',
  async (userId: string, { rejectWithValue }) => {
    await new Promise((res) => setTimeout(res, 800));
    if (userId === 'u3') return rejectWithValue('Failed to accept request');
    return userId;
  }
);

// Mock async decline barter request
export const declineBarterRequest = createAsyncThunk(
  'marketplace/declineBarterRequest',
  async (userId: string, { rejectWithValue }) => {
    await new Promise((res) => setTimeout(res, 800));
    if (userId === 'u1') return rejectWithValue('Failed to decline request');
    return userId;
  }
);

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketplaceUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceUsers.fulfilled, (state, action: PayloadAction<MarketplaceUser[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchMarketplaceUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      // Barter request cases
      .addCase(sendBarterRequest.pending, (state, action) => {
        state.requestLoading = true;
        state.requestError = null;
        // Set status to pending for this user (outgoing)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.meta.arg),
          { userId: action.meta.arg, status: 'pending', direction: 'outgoing' },
        ];
      })
      .addCase(sendBarterRequest.fulfilled, (state, action) => {
        state.requestLoading = false;
        // Set status to sent for this user (outgoing)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.payload),
          { userId: action.payload as string, status: 'sent', direction: 'outgoing' },
        ];
      })
      .addCase(sendBarterRequest.rejected, (state, action) => {
        state.requestLoading = false;
        state.requestError = action.payload as string || 'Failed to send request';
        // Set status to error for this user (outgoing)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.meta.arg),
          { userId: action.meta.arg, status: 'error', direction: 'outgoing' },
        ];
      })
      // Accept barter request
      .addCase(acceptBarterRequest.pending, (state, action) => {
        state.requestLoading = true;
        state.requestError = null;
      })
      .addCase(acceptBarterRequest.fulfilled, (state, action) => {
        state.requestLoading = false;
        // Set status to accepted for this user (incoming)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.payload),
          { userId: action.payload as string, status: 'accepted', direction: 'incoming' },
        ];
      })
      .addCase(acceptBarterRequest.rejected, (state, action) => {
        state.requestLoading = false;
        state.requestError = action.payload as string || 'Failed to accept request';
        // Set status to error for this user (incoming)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.meta.arg),
          { userId: action.meta.arg, status: 'error', direction: 'incoming' },
        ];
      })
      // Decline barter request
      .addCase(declineBarterRequest.pending, (state, action) => {
        state.requestLoading = true;
        state.requestError = null;
      })
      .addCase(declineBarterRequest.fulfilled, (state, action) => {
        state.requestLoading = false;
        // Set status to declined for this user (incoming)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.payload),
          { userId: action.payload as string, status: 'declined', direction: 'incoming' },
        ];
      })
      .addCase(declineBarterRequest.rejected, (state, action) => {
        state.requestLoading = false;
        state.requestError = action.payload as string || 'Failed to decline request';
        // Set status to error for this user (incoming)
        state.barterRequests = [
          ...state.barterRequests.filter((r) => r.userId !== action.meta.arg),
          { userId: action.meta.arg, status: 'error', direction: 'incoming' },
        ];
      });
  },
});

export default marketplaceSlice.reducer; 