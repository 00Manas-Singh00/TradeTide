import { Request, Response } from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import mongoose from 'mongoose';
import { getSocketService } from '../services/socketService';

// Get all chats for the current user
export const getUserChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: userId
    }).populate({
      path: 'participants',
      select: 'username email'
    });

    return res.status(200).json(chats);
  } catch (error) {
    console.error('Error getting user chats:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get a specific chat with messages
export const getChatById = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Find the chat and check if user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    }).populate({
      path: 'participants',
      select: 'username email'
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Get messages for this chat
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate({
        path: 'senderId',
        select: 'username email'
      });

    // Mark all unread messages as read if they weren't sent by the current user
    await Message.updateMany(
      { 
        chatId,
        senderId: { $ne: userId },
        read: false
      },
      { read: true }
    );

    // Notify other participants that messages have been read
    const socketService = getSocketService();
    if (socketService) {
      socketService.sendToChat(chatId, 'messages_read', { chatId, userId });
    }

    return res.status(200).json({
      chat,
      messages
    });
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Create a new chat
export const createChat = async (req: Request, res: Response) => {
  try {
    const { participantId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate participant ID
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Invalid participant ID' });
    }

    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, participantId] }
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    // Create new chat
    const newChat = new Chat({
      participants: [userId, participantId]
    });

    await newChat.save();

    // Populate participant details
    const populatedChat = await Chat.findById(newChat._id).populate({
      path: 'participants',
      select: 'username email'
    });

    // Notify the other participant about the new chat
    const socketService = getSocketService();
    if (socketService) {
      socketService.sendToUser(participantId, 'new_chat', populatedChat);
    }

    return res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Send a message in a chat
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate inputs
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Check if chat exists and user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Create and save the message
    const newMessage = new Message({
      chatId,
      senderId: userId,
      content,
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

    // Notify chat participants via WebSockets
    const socketService = getSocketService();
    if (socketService) {
      socketService.sendToChat(chatId, 'new_message', populatedMessage);
      
      // Also notify other participants individually
      const chatParticipants = chat.participants as mongoose.Types.ObjectId[];
      chatParticipants.forEach((participantId) => {
        const participantIdStr = participantId.toString();
        if (participantIdStr !== userId) {
          socketService.sendToUser(participantIdStr, 'chat_notification', {
            chatId,
            message: populatedMessage
          });
        }
      });
    }

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get unread message count for a user
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find all chats where the user is a participant
    const chats = await Chat.find({ participants: userId });
    
    // Count unread messages in each chat
    let totalUnread = 0;
    
    for (const chat of chats) {
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        senderId: { $ne: userId },
        read: false
      });
      
      totalUnread += unreadCount;
    }

    return res.status(200).json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}; 