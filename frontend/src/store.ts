import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import profileReducer from './features/profile/profileSlice';
import marketplaceReducer from './features/marketplace/marketplaceSlice';
import chatReducer from './features/chat/chatSlice';
import schedulingReducer from './features/scheduling/schedulingSlice';
import notificationsReducer from './features/notifications/notificationsSlice';
import reviewsReducer from './features/reviews/reviewsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    marketplace: marketplaceReducer,
    chat: chatReducer,
    scheduling: schedulingReducer,
    notifications: notificationsReducer,
    reviews: reviewsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 