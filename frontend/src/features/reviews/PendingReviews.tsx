import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchPendingReviews } from './reviewsSlice';
import { fetchSessionDetails } from '../scheduling/schedulingApi';
import AddReviewForm from './AddReviewForm';

interface PendingReviewsProps {
  limit?: number;
}

interface PendingSession {
  id: string;
  otherUserId: string;
  otherUserName: string;
  skill: string;
  date: string;
}

const PendingReviews: React.FC<PendingReviewsProps> = ({ limit }) => {
  const dispatch = useAppDispatch();
  const { pendingReviews, loading } = useAppSelector((state) => state.reviews);
  const authUser = useAppSelector((state) => state.auth.user);
  const userId = (authUser as any)?.id || (authUser as any)?._id || (authUser as any)?.email;
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PendingSession[]>([]);

  useEffect(() => {
    if (userId) {
      dispatch(fetchPendingReviews(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    async function loadSessions() {
      if (pendingReviews.length) {
        const details = await fetchSessionDetails(pendingReviews);
        setSessions((details as any[]).map((s) => ({
          id: s.id || s._id,
          otherUserId: s.userIds.find((uid: string) => uid !== userId),
          otherUserName: s.otherUserName || '', // You may need to fetch user details if not included
          skill: s.skill,
          date: s.date,
        })));
      } else {
        setSessions([]);
      }
    }
    loadSessions();
  }, [pendingReviews, userId]);

  // Apply limit if provided
  const displayedSessions = limit ? sessions.slice(0, limit) : sessions;

  if (loading && sessions.length === 0) {
    return <div className="text-gray-500">Loading pending reviews...</div>;
  }

  if (displayedSessions.length === 0) {
    return <div className="text-gray-500">No pending reviews.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Reviews</h3>
      {displayedSessions.map((session) => (
        <div key={session.id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{session.skill} with {session.otherUserName || session.otherUserId}</div>
              <div className="text-sm text-gray-500">
                {new Date(session.date).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition"
            >
              {expandedSessionId === session.id ? 'Cancel' : 'Review'}
            </button>
          </div>
          
          {expandedSessionId === session.id && (
            <AddReviewForm
              revieweeId={session.otherUserId}
              revieweeName={session.otherUserName}
              sessionId={session.id}
              skill={session.skill}
              onSuccess={() => setExpandedSessionId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default PendingReviews; 