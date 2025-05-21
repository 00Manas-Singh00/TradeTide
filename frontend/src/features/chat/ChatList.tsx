import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchChats, fetchUnreadCount, addChat } from './chatSlice';
import ChatWindow from './ChatWindow';
import socketService from '../../services/socketService';

const ChatList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { chats, loading, error, unreadCount } = useAppSelector((state) => state.chat);
  const profile = useAppSelector((state) => state.profile);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const currentUserId = profile.email || 'me';
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch chats when component mounts
  useEffect(() => {
    dispatch(fetchChats());
    dispatch(fetchUnreadCount());
    
    // Connect to WebSocket if not already connected
    if (currentUserId) {
      socketService.connect(currentUserId);
    }
    
    // Clean up when component unmounts
    return () => {
      // No need to disconnect as we want to keep the connection for notifications
    };
  }, [dispatch, currentUserId]);

  // Sort chats by most recent activity
  const sortedChats = [...chats].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Filter chats by search term
  const filteredChats = searchTerm
    ? sortedChats.filter(chat => {
        const otherUserId = chat.userIds.find(id => id !== currentUserId);
        const otherUserName = otherUserId ? chat.userNames[otherUserId] : '';
        return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : sortedChats;

  // Format timestamp to a readable format
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get the last message preview for a chat
  const getLastMessagePreview = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || chat.messages.length === 0) return 'No messages';
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.content.length > 30 
      ? lastMessage.content.substring(0, 30) + '...'
      : lastMessage.content;
  };

  // Get unread message count for a chat
  const getUnreadCount = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return 0;
    
    return chat.messages.filter(msg => !msg.read && msg.senderId !== currentUserId).length;
  };

  // Get other user's name in a chat
  const getOtherUserName = (chat: any) => {
    const otherUserId = chat.userIds.find((id: string) => id !== currentUserId);
    return otherUserId ? chat.userNames[otherUserId] : 'Unknown User';
  };

  // Handle opening a chat
  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
    
    // Mark messages as read via WebSocket
    socketService.markMessagesAsRead(chatId, currentUserId);
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header bg-primary text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Messages</h2>
          {unreadCount > 0 && (
            <div className="badge badge-accent">
              {unreadCount} new
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading && chats.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading conversations...</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 m-4 bg-red-50 text-error rounded-lg">
            <p className="font-medium">Error loading chats</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {chats.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">
            <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="mt-1">Start chatting with someone from the marketplace</p>
          </div>
        )}
        
        {filteredChats.length === 0 && searchTerm && (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations matching "{searchTerm}"</p>
          </div>
        )}
        
        <div className="divide-y">
          {filteredChats.map(chat => {
            const unread = getUnreadCount(chat.id);
            const otherUserName = getOtherUserName(chat);
            const lastMessage = getLastMessagePreview(chat.id);
            
            return (
              <div 
                key={chat.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                  unread > 0 ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleOpenChat(chat.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="avatar">
                    {otherUserName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">{otherUserName}</h3>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1 flex justify-between items-center">
                      <p className={`truncate pr-2 ${unread > 0 ? 'font-medium' : ''}`}>
                        {lastMessage}
                      </p>
                      {unread > 0 && (
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {activeChatId && (
        <ChatWindow 
          chatId={activeChatId} 
          onClose={() => setActiveChatId(null)} 
        />
      )}
    </div>
  );
};

export default ChatList; 