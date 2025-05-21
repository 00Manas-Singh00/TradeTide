import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageReadStatus, fetchUnreadCount } from '../features/chat/chatSlice';
import { addNotification } from '../features/notifications/notificationsSlice';

class SocketService {
  private socket: Socket | null = null;
  private authenticated = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  // Initialize the socket connection
  public init(): void {
    if (this.socket) return;

    // Always connect to backend on port 5001
    const apiUrl = 'ws://localhost:5001';
    this.socket = io(apiUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupEventListeners();
  }

  // Try to connect with incrementing ports
  private tryConnect(baseUrl: string, port: number): void {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error('Failed to connect to WebSocket server after multiple attempts');
      return;
    }

    const apiUrl = `${baseUrl}:${port}`;
    console.log(`Attempting to connect to WebSocket at ${apiUrl}`);
    
    this.socket = io(apiUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    
    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionAttempts++;
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Retrying with port ${port + 1}...`);
        this.socket?.removeAllListeners();
        this.socket?.close();
        this.socket = null;
        this.tryConnect(baseUrl, port + 1);
      }
    });
  }

  // Connect to the socket server and authenticate
  public connect(userId: string): void {
    if (!this.socket) this.init();
    if (!this.socket) return;

    if (!this.socket.connected) {
      this.socket.connect();
    }

    if (!this.authenticated && userId) {
      this.socket.emit('authenticate', userId);
      this.authenticated = true;
    }
  }

  // Disconnect from the socket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.authenticated = false;
    }
  }

  // Join a specific chat room
  public joinChat(chatId: string): void {
    if (this.socket && this.authenticated) {
      this.socket.emit('join_chat', chatId);
    }
  }

  // Leave a specific chat room
  public leaveChat(chatId: string): void {
    if (this.socket && this.authenticated) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Send a message through WebSocket
  public sendMessage(chatId: string, senderId: string, content: string): void {
    if (this.socket && this.authenticated) {
      this.socket.emit('send_message', { chatId, senderId, content });
    }
  }

  // Send typing indicator
  public sendTypingIndicator(chatId: string, userId: string, isTyping: boolean): void {
    if (this.socket && this.authenticated) {
      this.socket.emit('typing', { chatId, userId, isTyping });
    }
  }

  // Mark messages as read
  public markMessagesAsRead(chatId: string, userId: string): void {
    if (this.socket && this.authenticated) {
      this.socket.emit('mark_read', { chatId, userId });
    }
  }

  // Set up socket event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionAttempts = 0; // Reset attempts on successful connection
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.authenticated = false;
    });

    // Chat events
    this.socket.on('new_message', (message) => {
      // Add the message to the store
      store.dispatch(addMessage(message));
      
      // Update unread count
      store.dispatch(fetchUnreadCount());
    });

    this.socket.on('messages_read', ({ chatId, userId }) => {
      // Update message read status in the store
      store.dispatch(updateMessageReadStatus({ chatId, userId }));
    });

    this.socket.on('user_typing', ({ userId, isTyping }) => {
      // Handle typing indicator (could dispatch an action to show typing status)
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
    });

    this.socket.on('chat_notification', ({ chatId, message }) => {
      // Add notification for new message when not in the chat
      const senderName = typeof message.senderId === 'string' 
        ? 'Someone' 
        : message.senderId.username;
      
      store.dispatch(addNotification({
        type: 'chat',
        message: `New message from ${senderName}`,
        data: { chatId }
      }));
      
      // Update unread count
      store.dispatch(fetchUnreadCount());
    });

    this.socket.on('new_chat', (chat) => {
      // Handle new chat creation (could dispatch an action to add the chat)
      store.dispatch(addNotification({
        type: 'chat',
        message: 'New chat created',
        data: { chatId: chat._id }
      }));
    });
  }
}

export const socketService = new SocketService();
export default socketService; 