import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiGet, apiPut } from '../../apiClient';

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
  avatarUrl?: string;
  coverPhotoUrl?: string;
  socialLinks?: { type: string; url: string }[];
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: ProfileState = {
  name: '',
  email: '',
  bio: '',
  skillsOffered: [],
  skillsWanted: [],
  avatarUrl: '',
  coverPhotoUrl: '',
  socialLinks: [],
  loading: false,
  error: null,
  success: null,
};

// Real async fetch profile
export const fetchProfile = createAsyncThunk('profile/fetchProfile', async () => {
  const data = await apiGet<any>('/api/profile');
  return {
    name: data.username,
    email: data.email,
    bio: data.bio || '',
    skillsOffered: (data.skillsOffered || []).map((name: string, idx: number) => ({ id: `${idx}`, name })),
    skillsWanted: (data.skillsWanted || []).map((name: string, idx: number) => ({ id: `${idx}`, name })),
    avatarUrl: data.avatarUrl || '',
    coverPhotoUrl: data.coverPhotoUrl || '',
    socialLinks: data.socialLinks || [],
  };
});

// Real async update profile
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profile: Omit<ProfileState, 'loading' | 'error' | 'success'>) => {
    const payload = {
      username: profile.name,
      email: profile.email,
      bio: profile.bio,
      skillsOffered: profile.skillsOffered.map(s => s.name),
      skillsWanted: profile.skillsWanted.map(s => s.name),
      avatarUrl: profile.avatarUrl,
      coverPhotoUrl: profile.coverPhotoUrl,
      socialLinks: profile.socialLinks,
    };
    const data = await apiPut<any>('/api/profile', payload);
    return {
      name: data.username,
      email: data.email,
      bio: data.bio || '',
      skillsOffered: (data.skillsOffered || []).map((name: string, idx: number) => ({ id: `${idx}`, name })),
      skillsWanted: (data.skillsWanted || []).map((name: string, idx: number) => ({ id: `${idx}`, name })),
      avatarUrl: data.avatarUrl || '',
      coverPhotoUrl: data.coverPhotoUrl || '',
      socialLinks: data.socialLinks || [],
    };
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
    clearProfileMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.name = action.payload.name;
        state.email = action.payload.email;
        state.bio = action.payload.bio;
        state.skillsOffered = action.payload.skillsOffered;
        state.skillsWanted = action.payload.skillsWanted;
        state.avatarUrl = action.payload.avatarUrl;
        state.coverPhotoUrl = action.payload.coverPhotoUrl;
        state.socialLinks = action.payload.socialLinks;
        state.success = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
        state.success = null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.name = action.payload.name;
        state.email = action.payload.email;
        state.bio = action.payload.bio;
        state.skillsOffered = action.payload.skillsOffered;
        state.skillsWanted = action.payload.skillsWanted;
        state.avatarUrl = action.payload.avatarUrl;
        state.coverPhotoUrl = action.payload.coverPhotoUrl;
        state.socialLinks = action.payload.socialLinks;
        state.success = 'Profile updated!';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
        state.success = null;
      });
  },
});

export const {
  addSkillOffered,
  removeSkillOffered,
  addSkillWanted,
  removeSkillWanted,
  clearProfileMessages,
} = profileSlice.actions;

export default profileSlice.reducer; 