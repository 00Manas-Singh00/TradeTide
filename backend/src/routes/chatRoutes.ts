import { Router } from 'express';
import requireAuth from '../middleware/requireAuth';
import { 
  getUserChats, 
  getChatById, 
  createChat, 
  sendMessage, 
  getUnreadCount 
} from '../controllers/chatController';

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

// Get all chats for the current user
router.get('/chats', getUserChats as any);

// Get a specific chat with messages
router.get('/chats/:chatId', getChatById as any);

// Create a new chat
router.post('/chats', createChat as any);

// Send a message in a chat
router.post('/messages', sendMessage as any);

// Get unread message count
router.get('/messages/unread', getUnreadCount as any);

export default router; 