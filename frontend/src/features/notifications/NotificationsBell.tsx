import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  markAsRead,
  removeNotification,
  markAllAsRead,
} from './notificationsSlice';

const NotificationsBell: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative inline-block text-left z-50">
      <button
        className="relative focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold">Notifications</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => dispatch(markAllAsRead())}
            >
              Mark all as read
            </button>
          </div>
          {notifications.length === 0 && (
            <div className="p-4 text-gray-500 text-center">No notifications</div>
          )}
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-2 px-4 py-3 border-b last:border-b-0 ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {n.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {!n.read && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => dispatch(markAsRead(n.id))}
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => dispatch(removeNotification(n.id))}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell; 