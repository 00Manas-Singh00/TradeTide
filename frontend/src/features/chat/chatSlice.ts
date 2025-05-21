import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as chatApi from './chatApi';
import type { ChatData, MessageData } from './chatApi';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  userIds: string[];
  userNames: Record<string, string>;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  typingUsers: Record<string, string[]>; // chatId -> userId[]
}

const initialState: ChatState = {
  chats: [],
  loading: false,
  error: null,
  unreadCount: 0,
  typingUsers: {},
};

// Fetch all chats for the current user
export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, { rejectWithValue }) => {
  try {
    const chats = await chatApi.fetchUserChats();
    return chats;
  } catch (error) {
    console.error('Error fetching chats:', error);
    return rejectWithValue('Failed to fetch chats');
  }
});

// Fetch a specific chat with messages
export const fetchChatById = createAsyncThunk(
  'chat/fetchChatById',
  async (chatId: string, { rejectWithValue }) => {
    try {
      const chatWithMessages = await chatApi.fetchChatById(chatId);
      return chatWithMessages;
    } catch (error) {
      console.error('Error fetching chat:', error);
      return rejectWithValue('Failed to fetch chat');
    }
  }
);

// Create a new chat
export const createChat = createAsyncThunk(
  'chat/createChat',
  async (participantId: string, { rejectWithValue }) => {
    try {
      const chat = await chatApi.createChat(participantId);
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      return rejectWithValue('Failed to create chat');
    }
  }
);

// Send a message in a chat
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }: { chatId: string; content: string }, { rejectWithValue }) => {
    try {
      const message = await chatApi.sendMessage(chatId, content);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return rejectWithValue('Failed to send message');
    }
  }
);

// Get unread message count
export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatApi.getUnreadCount();
      return response.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return rejectWithValue('Failed to fetch unread count');
    }
  }
);

// Helper function to convert API chat data to our Chat format
const convertApiChatToChat = (chatData: ChatData): Chat => {
  const userIds = chatData.participants.map(p => p._id);
  const userNames: Record<string, string> = {};
  
  chatData.participants.forEach(p => {
    userNames[p._id] = p.username;
  });
  
  return {
    id: chatData._id,
    userIds,
    userNames,
    messages: [],
    updatedAt: chatData.updatedAt,
  };
};

// Helper function to convert API message data to our ChatMessage format
const convertApiMessageToChatMessage = (messageData: MessageData): ChatMessage => {
  let senderId = 'unknown';
  let senderName = 'Unknown';
  if (messageData.senderId) {
    senderId = typeof messageData.senderId === 'string'
      ? messageData.senderId
      : messageData.senderId._id || 'unknown';
    senderName = typeof messageData.senderId === 'string'
      ? 'Unknown'
      : messageData.senderId.username || 'Unknown';
  }
  return {
    id: messageData._id,
    chatId: messageData.chatId,
    senderId,
    senderName,
    content: messageData.content,
    timestamp: messageData.createdAt,
    read: messageData.read,
  };
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add a new message received via WebSockets
    addMessage: (state, action: PayloadAction<MessageData>) => {
      const message = convertApiMessageToChatMessage(action.payload);
      const chatId = message.chatId;
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      
      if (chatIndex >= 0) {
        // Add message to chat if it doesn't already exist
        const messageExists = state.chats[chatIndex].messages.some(m => m.id === message.id);
        if (!messageExists) {
          state.chats[chatIndex].messages.push(message);
          
          // Update chat timestamp
          state.chats[chatIndex].updatedAt = new Date().toISOString();
        }
      }
    },
    
    // Update message read status
    updateMessageReadStatus: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      
      if (chatIndex >= 0) {
        // Mark all messages as read that were sent by others
        state.chats[chatIndex].messages.forEach(message => {
          if (message.senderId !== userId) {
            message.read = true;
          }
        });
      }
    },
    
    // Update typing status
    setUserTyping: (state, action: PayloadAction<{ chatId: string; userId: string; isTyping: boolean }>) => {
      const { chatId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      if (isTyping) {
        // Add user to typing list if not already there
        if (!state.typingUsers[chatId].includes(userId)) {
          state.typingUsers[chatId].push(userId);
        }
      } else {
        // Remove user from typing list
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
      }
    },
    
    // Add a new chat received via WebSockets
    addChat: (state, action: PayloadAction<ChatData>) => {
      const chat = convertApiChatToChat(action.payload);
      const chatExists = state.chats.some(c => c.id === chat.id);
      
      if (!chatExists) {
        state.chats.push(chat);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch chats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action: PayloadAction<ChatData[]>) => {
        state.loading = false;
        // Convert API chat data to our format
        state.chats = action.payload.map(convertApiChatToChat);
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch chats';
      })
      
      // Fetch chat by ID
      .addCase(fetchChatById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.loading = false;
        const { chat, messages } = action.payload;
        
        // Convert chat data
        const convertedChat = convertApiChatToChat(chat);
        
        // Convert messages
        convertedChat.messages = messages.map(convertApiMessageToChatMessage);
        
        // Update or add chat to state
        const existingChatIndex = state.chats.findIndex(c => c.id === convertedChat.id);
        if (existingChatIndex >= 0) {
          state.chats[existingChatIndex] = convertedChat;
        } else {
          state.chats.push(convertedChat);
        }
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch chat';
      })
      
      // Create chat
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action: PayloadAction<ChatData>) => {
        state.loading = false;
        // Check if chat already exists
        const existingChatIndex = state.chats.findIndex(c => c.id === action.payload._id);
        if (existingChatIndex === -1) {
          // Add new chat
          state.chats.push(convertApiChatToChat(action.payload));
        }
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create chat';
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<MessageData>) => {
        const chatId = action.payload.chatId;
        const chatIndex = state.chats.findIndex(c => c.id === chatId);
        
        if (chatIndex >= 0) {
          // Add message to chat
          const message = convertApiMessageToChatMessage(action.payload);
          state.chats[chatIndex].messages.push(message);
          
          // Update chat timestamp
          state.chats[chatIndex].updatedAt = new Date().toISOString();
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to send message';
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      });
  },
});

export const { addMessage, updateMessageReadStatus, setUserTyping, addChat } = chatSlice.actions;
export default chatSlice.reducer; 