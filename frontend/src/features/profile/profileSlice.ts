import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Skill {
  id: string;
  name: string;
}

export interface ProfileState {
  name: string;
  email: string;
  bio: string;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  name: '',
  email: '',
  bio: '',
  skillsOffered: [],
  skillsWanted: [],
  loading: false,
  error: null,
};

// Mock async fetch profile
export const fetchProfile = createAsyncThunk('profile/fetchProfile', async () => {
  await new Promise((res) => setTimeout(res, 1000));
  // Mock profile data
  return {
    name: 'Test User',
    email: 'test@example.com',
    bio: 'I love learning and sharing skills! 🎨',
    skillsOffered: [
      { id: '1', name: 'Digital Art' },
    ],
    skillsWanted: [
      { id: '2', name: 'French Lessons' },
    ],
  };
});

// Mock async update profile
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profile: Omit<ProfileState, 'loading' | 'error'>) => {
    await new Promise((res) => setTimeout(res, 1000));
    return profile;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    addSkillOffered(state, action: PayloadAction<Skill>) {
      state.skillsOffered.push(action.payload);
    },
    removeSkillOffered(state, action: PayloadAction<string>) {
      state.skillsOffered = state.skillsOffered.filter(skill => skill.id !== action.payload);
    },
    addSkillWanted(state, action: PayloadAction<Skill>) {
      state.skillsWanted.push(action.payload);
    },
    removeSkillWanted(state, action: PayloadAction<string>) {
      state.skillsWanted = state.skillsWanted.filter(skill => skill.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.name = action.payload.name;
        state.email = action.payload.email;
        state.skillsOffered = action.payload.skillsOffered;
        state.skillsWanted = action.payload.skillsWanted;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.name = action.payload.name;
        state.email = action.payload.email;
        state.skillsOffered = action.payload.skillsOffered;
        state.skillsWanted = action.payload.skillsWanted;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      });
  },
});

export const {
  addSkillOffered,
  removeSkillOffered,
  addSkillWanted,
  removeSkillWanted,
} = profileSlice.actions;

export default profileSlice.reducer; 