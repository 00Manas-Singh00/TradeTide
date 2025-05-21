import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchChatById, sendMessage, fetchUnreadCount } from './chatSlice';
import SchedulingModal from '../scheduling/SchedulingModal';
import { addNotification } from '../notifications/notificationsSlice';
import socketService from '../../services/socketService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  chatId: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onClose }) => {
  const dispatch = useAppDispatch();
  const { chats, loading, error, typingUsers } = useAppSelector((state) => state.chat);
  const [message, setMessage] = useState('');
  const [openSchedule, setOpenSchedule] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const profile = useAppSelector((state) => state.profile);
  const currentUserId = profile.email || 'me';
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat data when component mounts or chatId changes
  useEffect(() => {
    dispatch(fetchChatById(chatId));
    
    // Join the chat room via WebSocket
    socketService.joinChat(chatId);
    
    // Mark messages as read
    socketService.markMessagesAsRead(chatId, currentUserId);
    
    return () => {
      // Leave the chat room when component unmounts
      socketService.leaveChat(chatId);
      
      // Clear typing timeout if exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [dispatch, chatId, currentUserId]);

  // Find the current chat
  const chat = chats.find((c) => c.id === chatId);
  
  // Get other user info
  const otherUserId = chat?.userIds.find(id => id !== currentUserId) || '';
  const otherUserName = otherUserId && chat?.userNames ? chat.userNames[otherUserId] : 'User';
  
  // Get typing users for this chat
  const chatTypingUsers = typingUsers[chatId] || [];
  const isOtherUserTyping = chatTypingUsers.some(id => id === otherUserId);

  const handleSend = async () => {
    if (message.trim() && chat) {
      // Send message via REST API
      const result = await dispatch(
        sendMessage({
          chatId: chat.id,
          content: message.trim()
        })
      );
      
      // Also send via WebSocket for real-time delivery
      socketService.sendMessage(chat.id, currentUserId, message.trim());
      
      if (sendMessage.fulfilled.match(result)) {
        dispatch(addNotification({
          type: 'chat',
          message: `Message sent to ${otherUserName}.`,
        }));
        
        // Update unread count
        dispatch(fetchUnreadCount());
      }
      
      setMessage('');
    }
  };

  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    socketService.sendTypingIndicator(chatId, currentUserId, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTypingIndicator(chatId, currentUserId, false);
    }, 2000);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length]);

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-lg w-full max-w-xl flex flex-col h-[80vh] max-h-[700px]"
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="avatar">
                {otherUserName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{otherUserName}</h3>
                {isOtherUserTyping && (
                  <p className="text-xs text-primary">typing...</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setOpenSchedule(true)}
                className="btn btn-sm btn-outline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule
              </button>
              
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading && (
              <div className="flex justify-center">
                <div className="bg-white px-4 py-2 rounded-lg shadow text-primary">
                  Loading messages...
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 px-4 py-2 rounded-lg text-error">
                  {error}
                </div>
              </div>
            )}
            
            {chat?.messages.map((msg) => (
              <div
                key={`${msg.id}-${msg.timestamp}`}
                className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                {msg.senderId !== currentUserId && (
                  <div className="avatar-sm mr-2 self-end">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div
                  className={`px-4 py-2 rounded-lg max-w-[70%] shadow-sm ${
                    msg.senderId === currentUserId 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="break-words">{msg.content}</div>
                  <div className={`text-xs text-right mt-1 ${
                    msg.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(msg.timestamp)}
                    {msg.senderId === currentUserId && (
                      <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
                
                {msg.senderId === currentUserId && (
                  <div className="avatar-sm ml-2 self-end">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
              </div>
            ))}
            
            {isOtherUserTyping && (
              <div className="flex justify-start">
                <div className="avatar-sm mr-2">
                  {otherUserName.charAt(0).toUpperCase()}
                </div>
                <div className="bg-white text-gray-500 px-4 py-2 rounded-lg rounded-bl-none text-sm shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <form 
              className="flex gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="form-input flex-1"
                placeholder="Type a message..."
                value={message}
                onChange={handleTyping}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!message.trim()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
      
      {openSchedule && (
        <SchedulingModal
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          onClose={() => setOpenSchedule(false)}
        />
      )}
    </AnimatePresence>
  );
};

export default ChatWindow; 