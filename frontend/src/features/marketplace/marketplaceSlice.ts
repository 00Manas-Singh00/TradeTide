import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchMarketplaceUsers as fetchMarketplaceUsersApi, sendBarterRequest as sendBarterRequestApi, acceptBarterRequest as acceptBarterRequestApi, declineBarterRequest as declineBarterRequestApi, fetchBarterRequests } from './marketplaceApi';
import type { MarketplaceUser as ApiMarketplaceUser } from './marketplaceApi';

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
  allSkills: Skill[];
}

const initialState: MarketplaceState = {
  users: [],
  loading: false,
  error: null,
  barterRequests: [],
  requestLoading: false,
  requestError: null,
  allSkills: [],
};

// Real async fetch users
export const fetchMarketplaceUsers = createAsyncThunk('marketplace/fetchUsers', async (params?: {
  skillsOffered?: string[];
  skillsWanted?: string[];
}) => {
  const users = await fetchMarketplaceUsersApi(params);
  // Map backend users to frontend MarketplaceUser type
  return users.map((u: ApiMarketplaceUser) => ({
    id: u._id,
    name: u.username,
    skillsOffered: (u.skillsOffered || []).map((name, idx) => ({ id: `${idx}`, name })),
    skillsWanted: (u.skillsWanted || []).map((name, idx) => ({ id: `${idx}`, name })),
    rating: 0, // Placeholder, backend does not provide rating yet
  }));
});

// Real async send barter request
export const sendBarterRequest = createAsyncThunk(
  'marketplace/sendBarterRequest',
  async (
    { receiverId, skill }: { receiverId: string; skill: string },
    { getState, rejectWithValue }
  ) => {
    try {
      // Get sender from auth state
      // @ts-ignore
      const state = getState();
      // @ts-ignore
      const sender = state.auth.user?._id || state.auth.user?.id;
      if (!sender) throw new Error('No sender user ID');
      await sendBarterRequestApi({ sender, receiver: receiverId, skill });
      return receiverId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send request');
    }
  }
);

// Real async accept barter request
export const acceptBarterRequest = createAsyncThunk(
  'marketplace/acceptBarterRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      await acceptBarterRequestApi(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to accept request');
    }
  }
);

// Real async decline barter request
export const declineBarterRequest = createAsyncThunk(
  'marketplace/declineBarterRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      await declineBarterRequestApi(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to decline request');
    }
  }
);

// Fetch all barter requests for the logged-in user
export const getBarterRequests = createAsyncThunk(
  'marketplace/getBarterRequests',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await fetchBarterRequests(userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch barter requests');
    }
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
        
        // Extract and store all unique skills
        const skillsSet = new Set<string>();
        action.payload.forEach(user => {
          user.skillsOffered.forEach(skill => skillsSet.add(JSON.stringify(skill)));
          user.skillsWanted.forEach(skill => skillsSet.add(JSON.stringify(skill)));
        });
        
        state.allSkills = Array.from(skillsSet).map(s => JSON.parse(s));
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
          ...state.barterRequests.filter((r) => r.userId !== action.meta.arg.receiverId),
          { userId: action.meta.arg.receiverId, status: 'pending', direction: 'outgoing' },
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
          ...state.barterRequests.filter((r) => r.userId !== action.meta.arg.receiverId),
          { userId: action.meta.arg.receiverId, status: 'error', direction: 'outgoing' },
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
      })
      .addCase(getBarterRequests.fulfilled, (state, action) => {
        // Store all barter requests (incoming and outgoing)
        state.barterRequests = action.payload as any[];
      });
  },
});

export default marketplaceSlice.reducer; 