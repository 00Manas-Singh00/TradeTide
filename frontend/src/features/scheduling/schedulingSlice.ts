import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as schedulingApi from './schedulingApi';

export interface Session {
  id: string;
  userIds: [string, string];
  scheduledBy: string;
  date: string; // ISO string
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  skill: string;
}

export interface SchedulingState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: SchedulingState = {
  sessions: [],
  loading: false,
  error: null,
};

// Real async fetch sessions
export const fetchSessions = createAsyncThunk('scheduling/fetchSessions', async (userId: string, { rejectWithValue }) => {
  try {
    return await schedulingApi.fetchSessions(userId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch sessions');
  }
});

// Real async create session
export const createSession = createAsyncThunk(
  'scheduling/createSession',
  async (
    { userId1, userId2, date, skill }: { userId1: string; userId2: string; date: string; skill: string },
    { rejectWithValue }
  ) => {
    try {
      return await schedulingApi.createSession({ userId1, userId2, date, skill });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create session');
    }
  }
);

const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload as Session[];
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.push(action.payload as Session);
      })
      .addCase(createSession.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to create session';
      });
  },
});

export default schedulingSlice.reducer; 