import React from 'react';
import ChatList from '../features/chat/ChatList';

const Messages: React.FC = () => {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-gray-500">Chat with other users on the platform</p>
      </div>
      
      <div className="h-[calc(100%-4rem)]">
        <ChatList />
      </div>
    </div>
  );
};

export default Messages; 