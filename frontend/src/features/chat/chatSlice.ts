import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  userIds: [string, string]; // two users per chat
  messages: ChatMessage[];
}

export interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  loading: false,
  error: null,
};

// Mock async fetch chats
export const fetchChats = createAsyncThunk('chat/fetchChats', async () => {
  await new Promise((res) => setTimeout(res, 1000));
  // Mock chat data
  return [
    {
      id: 'c1',
      userIds: ['me', 'u1'] as [string, string],
      messages: [
        {
          id: 'm1',
          chatId: 'c1',
          senderId: 'me',
          receiverId: 'u1',
          content: 'Hi Alice, excited to trade skills!',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'm2',
          chatId: 'c1',
          senderId: 'u1',
          receiverId: 'me',
          content: 'Me too! When are you available?',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ];
});

// Mock async create chat
export const createChat = createAsyncThunk(
  'chat/createChat',
  async (
    { userId1, userId2 }: { userId1: string; userId2: string },
    { getState }
  ) => {
    await new Promise((res) => setTimeout(res, 500));
    const state = getState() as { chat: ChatState };
    const existing = state.chat.chats.find(
      (c) => c.userIds.includes(userId1) && c.userIds.includes(userId2)
    );
    if (existing) return existing;
    return {
      id: 'c-' + userId1 + '-' + userId2,
      userIds: [userId1, userId2] as [string, string],
      messages: [],
    };
  }
);

// Mock async send message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { chatId, senderId, receiverId, content }: { chatId: string; senderId: string; receiverId: string; content: string },
    { rejectWithValue }
  ) => {
    await new Promise((res) => setTimeout(res, 500));
    if (!content) return rejectWithValue('Message cannot be empty');
    return {
      id: Math.random().toString(36).substr(2, 9),
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
    };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action: PayloadAction<Chat[]>) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch chats';
      })
      .addCase(createChat.fulfilled, (state, action: PayloadAction<Chat>) => {
        // Only add if not already present
        if (!state.chats.find((c) => c.id === action.payload.id)) {
          state.chats.push(action.payload);
        }
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        const chat = state.chats.find((c) => c.id === action.payload.chatId);
        if (chat) {
          chat.messages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to send message';
      });
  },
});

export default chatSlice.reducer; 