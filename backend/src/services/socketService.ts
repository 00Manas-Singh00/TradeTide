import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import Message from '../models/Message';
import Chat from '../models/Chat';

// Store active user connections
interface UserSocketMap {
  [userId: string]: string; // userId -> socketId
}

export class SocketService {
  private io: SocketIOServer;
  private userSockets: UserSocketMap = {};

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`New socket connection: ${socket.id}`);

      // User authentication
      socket.on('authenticate', (userId: string) => {
        if (userId) {
          this.userSockets[userId] = socket.id;
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
          socket.join(`user:${userId}`); // Join a room specific to this user
        }
      });

      // Join a specific chat room
      socket.on('join_chat', (chatId: string) => {
        if (chatId) {
          socket.join(`chat:${chatId}`);
          console.log(`Socket ${socket.id} joined chat ${chatId}`);
        }
      });

      // Leave a specific chat room
      socket.on('leave_chat', (chatId: string) => {
        if (chatId) {
          socket.leave(`chat:${chatId}`);
          console.log(`Socket ${socket.id} left chat ${chatId}`);
        }
      });

      // Handle new message
      socket.on('send_message', async (messageData: {
        chatId: string;
        senderId: string;
        content: string;
      }) => {
        try {
          const { chatId, senderId, content } = messageData;

          // Validate input
          if (!mongoose.Types.ObjectId.isValid(chatId) || 
              !mongoose.Types.ObjectId.isValid(senderId) || 
              !content.trim()) {
            return;
          }

          // Check if chat exists and user is a participant
          const chat = await Chat.findOne({
            _id: chatId,
            participants: senderId
          });

          if (!chat) {
            return;
          }

          // Create and save the message
          const newMessage = new Message({
            chatId,
            senderId,
            content: content.trim(),
            read: false
          });

          await newMessage.save();

          // Update chat's updatedAt timestamp
          await Chat.updateOne({ _id: chatId }, { updatedAt: new Date() });

          // Populate sender details
          const populatedMessage = await Message.findById(newMessage._id).populate({
            path: 'senderId',
            select: 'username email'
          });

          // Emit to all users in this chat room
          this.io.to(`chat:${chatId}`).emit('new_message', populatedMessage);

          // Also notify other participants who might not be in the chat room currently
          const chatParticipants = chat.participants as mongoose.Types.ObjectId[];
          chatParticipants.forEach((participantId) => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== senderId) {
              this.io.to(`user:${participantIdStr}`).emit('chat_notification', {
                chatId,
                message: populatedMessage
              });
            }
          });
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      // Handle typing indicator
      socket.on('typing', ({ chatId, userId, isTyping }: { 
        chatId: string; 
        userId: string;
        isTyping: boolean;
      }) => {
        socket.to(`chat:${chatId}`).emit('user_typing', { userId, isTyping });
      });

      // Handle read receipts
      socket.on('mark_read', async ({ chatId, userId }: { chatId: string; userId: string }) => {
        try {
          // Update messages as read
          await Message.updateMany(
            { 
              chatId,
              senderId: { $ne: userId },
              read: false
            },
            { read: true }
          );

          // Notify other users in the chat
          socket.to(`chat:${chatId}`).emit('messages_read', { chatId, userId });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        // Remove user from userSockets map
        for (const [userId, socketId] of Object.entries(this.userSockets)) {
          if (socketId === socket.id) {
            delete this.userSockets[userId];
            break;
          }
        }
      });
    });
  }

  // Get the socket service instance
  public getIO(): SocketIOServer {
    return this.io;
  }

  // Send a notification to a specific user
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets[userId];
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Send to all users in a chat
  public sendToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }
}

let socketService: SocketService | null = null;

export const initSocketService = (server: HttpServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
}; 