import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

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

// Mock async fetch sessions
export const fetchSessions = createAsyncThunk('scheduling/fetchSessions', async () => {
  await new Promise((res) => setTimeout(res, 1000));
  // Mock session data
  return [
    {
      id: 's1',
      userIds: ['me', 'u1'] as [string, string],
      scheduledBy: 'me',
      date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      status: 'pending' as 'pending',
      skill: 'Digital Art',
    },
  ];
});

// Mock async create session
export const createSession = createAsyncThunk(
  'scheduling/createSession',
  async (
    { userId1, userId2, date, skill }: { userId1: string; userId2: string; date: string; skill: string },
    { rejectWithValue }
  ) => {
    await new Promise((res) => setTimeout(res, 500));
    if (!date || !skill) return rejectWithValue('Date and skill are required');
    return {
      id: 's-' + Math.random().toString(36).substr(2, 9),
      userIds: [userId1, userId2] as [string, string],
      scheduledBy: userId1,
      date,
      status: 'pending' as 'pending',
      skill,
    };
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
      .addCase(fetchSessions.fulfilled, (state, action: PayloadAction<Session[]>) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      })
      .addCase(createSession.fulfilled, (state, action: PayloadAction<Session>) => {
        state.sessions.push(action.payload);
      })
      .addCase(createSession.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to create session';
      });
  },
});

export default schedulingSlice.reducer; 