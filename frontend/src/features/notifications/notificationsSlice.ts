import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'barter' | 'chat' | 'session' | 'review' | 'info';
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>; // Optional data for additional context
}

export interface NotificationsState {
  notifications: Notification[];
}

const initialState: NotificationsState = {
  notifications: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'read' | 'createdAt'>>) => {
      state.notifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        read: false,
        createdAt: new Date().toISOString(),
        ...action.payload,
      });
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) notif.read = true;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, markAsRead, removeNotification, markAllAsRead, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer; 