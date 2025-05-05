import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchChats, sendMessage } from './chatSlice';
import type { Chat, ChatMessage } from './chatSlice';
import SchedulingModal from '../scheduling/SchedulingModal';
import { addNotification } from '../notifications/notificationsSlice';

interface ChatWindowProps {
  chatId: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onClose }) => {
  const dispatch = useAppDispatch();
  const { chats, loading, error } = useAppSelector((state) => state.chat);
  const [message, setMessage] = useState('');
  const [openSchedule, setOpenSchedule] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const chat: Chat | undefined = chats.find((c) => c.id === chatId);
  const currentUserId = 'me'; // For demo/mock
  const otherUserId = chat?.userIds.find((id) => id !== currentUserId) || '';
  const otherUserName = otherUserId ? `User ${otherUserId}` : 'Other User';

  const handleSend = async () => {
    if (message.trim() && chat) {
      const result = await dispatch(
        sendMessage({
          chatId: chat.id,
          senderId: currentUserId,
          receiverId: otherUserId,
          content: message.trim(),
        })
      );
      if (sendMessage.fulfilled.match(result)) {
        dispatch(addNotification({
          type: 'chat',
          message: `Message sent to ${otherUserName}.`,
        }));
      }
      setMessage('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-[70vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Chat</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {loading && <div className="text-blue-500">Loading messages...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {chat?.messages.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-xs text-sm shadow
                  ${msg.senderId === currentUserId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}
              >
                {msg.content}
                <div className="text-xs text-right mt-1 opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 focus:outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
        <div className="p-4 border-t flex justify-end">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={() => setOpenSchedule(true)}
          >
            Schedule Session
          </button>
        </div>
      </div>
      {openSchedule && (
        <SchedulingModal
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          onClose={() => setOpenSchedule(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow; 