import { apiGet, apiPost } from '../../apiClient';

export interface ChatParticipant {
  _id: string;
  username: string;
  email: string;
}

export interface ChatData {
  _id: string;
  participants: ChatParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  _id: string;
  chatId: string;
  senderId: {
    _id: string;
    username: string;
    email: string;
  } | string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatWithMessages {
  chat: ChatData;
  messages: MessageData[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Get all chats for the current user
export const fetchUserChats = async (): Promise<ChatData[]> => {
  return apiGet<ChatData[]>('/api/chat/chats');
};

// Get a specific chat with messages
export const fetchChatById = async (chatId: string): Promise<ChatWithMessages> => {
  return apiGet<ChatWithMessages>(`/api/chat/chats/${chatId}`);
};

// Create a new chat
export const createChat = async (participantId: string): Promise<ChatData> => {
  return apiPost<ChatData>('/api/chat/chats', { participantId });
};

// Send a message in a chat
export const sendMessage = async (chatId: string, content: string): Promise<MessageData> => {
  return apiPost<MessageData>('/api/chat/messages', { chatId, content });
};

// Get unread message count
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  return apiGet<UnreadCountResponse>('/api/chat/messages/unread');
}; 