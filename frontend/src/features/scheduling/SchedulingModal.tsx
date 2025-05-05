import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchSessions, createSession } from './schedulingSlice';
import type { Session } from './schedulingSlice';
import { addNotification } from '../notifications/notificationsSlice';
import AddReviewForm from '../../features/reviews/AddReviewForm';

interface SchedulingModalProps {
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
}

const SchedulingModal: React.FC<SchedulingModalProps> = ({ otherUserId, otherUserName, onClose }) => {
  const dispatch = useAppDispatch();
  const { sessions, loading, error } = useAppSelector((state) => state.scheduling);
  const [date, setDate] = useState('');
  const [skill, setSkill] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUserId = 'me'; // For demo/mock

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const userSessions = sessions.filter(
    (s) => s.userIds.includes(currentUserId) && s.userIds.includes(otherUserId)
  );

  const handlePropose = async () => {
    setFormError('');
    setSuccess('');
    if (!date || !skill) {
      setFormError('Please select a date and skill.');
      return;
    }
    const result = await dispatch(
      createSession({ userId1: currentUserId, userId2: otherUserId, date, skill })
    );
    if (createSession.fulfilled.match(result)) {
      setSuccess('Session proposed!');
      setDate('');
      setSkill('');
      dispatch(addNotification({
        type: 'session',
        message: `Session proposed with ${otherUserName} for ${skill}.`,
      }));
    } else {
      setFormError(result.payload as string || 'Failed to propose session');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Schedule with {otherUserName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Date & Time</label>
            <input
              type="datetime-local"
              className="w-full border rounded px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Skill</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. Digital Art"
            />
          </div>
          {formError && <div className="text-red-500 text-sm">{formError}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            onClick={handlePropose}
            disabled={loading}
          >
            Propose Session
          </button>
        </div>
        <div className="border-t p-4">
          <h4 className="font-semibold mb-2">Upcoming Sessions</h4>
          {loading && <div className="text-blue-500">Loading sessions...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {userSessions.length === 0 && !loading && (
            <div className="text-gray-500">No sessions scheduled yet.</div>
          )}
          <ul className="space-y-2">
            {userSessions.map((s: Session) => {
              const isCompleted = s.status === 'completed';
              const otherId = s.userIds.find((id) => id !== currentUserId) || otherUserId;
              const otherName = otherUserName;
              return (
                <li key={s.id} className="border rounded p-2 flex flex-col mb-2">
                  <span>
                    <span className="font-semibold">{s.skill}</span> &mdash;{' '}
                    {new Date(s.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="text-xs text-gray-600 mt-1">
                    Status: <span className="font-semibold">{s.status}</span>
                  </span>
                  {isCompleted && (
                    <AddReviewForm
                      revieweeId={otherId}
                      revieweeName={otherName}
                      sessionId={s.id}
                      skill={s.skill}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SchedulingModal; 