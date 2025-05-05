import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  fetchMarketplaceUsers,
  sendBarterRequest,
  acceptBarterRequest,
  declineBarterRequest,
} from '../features/marketplace/marketplaceSlice';
import type { MarketplaceUser, Skill } from '../features/marketplace/marketplaceSlice';
import ChatWindow from '../features/chat/ChatWindow';
import { createChat } from '../features/chat/chatSlice';
import SchedulingModal from '../features/scheduling/SchedulingModal';
import { addNotification } from '../features/notifications/notificationsSlice';
import ReviewsList from '../features/reviews/ReviewsList';

const Marketplace: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error, barterRequests } = useAppSelector((state) => state.marketplace);
  const { skillsOffered: mySkillsOffered, skillsWanted: mySkillsWanted } = useAppSelector((state) => state.profile);
  const [skillFilter, setSkillFilter] = useState('');
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [openScheduleUser, setOpenScheduleUser] = useState<{ id: string; name: string } | null>(null);
  const { chats } = useAppSelector((state) => state.chat);
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const [openReviewsUser, setOpenReviewsUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    dispatch(fetchMarketplaceUsers());
  }, [dispatch]);

  // DEMO: Add a mock incoming request for user 'u1' if not already present
  useEffect(() => {
    if (!barterRequests.some(r => r.userId === 'u1' && r.direction === 'incoming')) {
      barterRequests.push({
        userId: 'u1',
        status: 'pending',
        direction: 'incoming',
      });
    }
  }, [barterRequests]);

  // Get all unique skills for filter dropdown
  const allSkills: Skill[] = Array.from(
    users.reduce((set, user) => {
      user.skillsOffered.forEach((s) => set.add(JSON.stringify(s)));
      user.skillsWanted.forEach((s) => set.add(JSON.stringify(s)));
      return set;
    }, new Set<string>())
  ).map((s) => JSON.parse(s));

  // Filter users by selected skill
  const filteredUsers = skillFilter
    ? users.filter(
        (user) =>
          user.skillsOffered.some((s) => s.id === skillFilter) ||
          user.skillsWanted.some((s) => s.id === skillFilter)
      )
    : users;

  // Mutual match logic
  const isMutualMatch = (user: MarketplaceUser) => {
    // You offer a skill they want
    const youOfferTheyWant = mySkillsOffered.some((mySkill) =>
      user.skillsWanted.some((theirWant) => theirWant.id === mySkill.id)
    );
    // They offer a skill you want
    const theyOfferYouWant = user.skillsOffered.some((theirSkill) =>
      mySkillsWanted.some((myWant) => myWant.id === theirSkill.id)
    );
    return youOfferTheyWant && theyOfferYouWant;
  };

  const mutualMatches = filteredUsers.filter(isMutualMatch);
  const otherUsers = filteredUsers.filter((user) => !isMutualMatch(user));

  // Get barter request for a user
  const getRequest = (userId: string) =>
    barterRequests.find((r) => r.userId === userId);

  // Find chatId for a user (demo: match chat with userId)
  const getChatIdForUser = (userId: string) => {
    const chat = chats.find((c) => c.userIds.includes(userId));
    return chat ? chat.id : null;
  };

  // Send barter request handler with notification
  const handleSendBarterRequest = async (userId: string, userName: string) => {
    const result = await dispatch(sendBarterRequest(userId));
    if (sendBarterRequest.fulfilled.match(result)) {
      dispatch(addNotification({
        type: 'barter',
        message: `Barter request sent to ${userName}.`,
      }));
    } else {
      dispatch(addNotification({
        type: 'barter',
        message: `Failed to send barter request to ${userName}.`,
      }));
    }
  };

  // Accept barter request handler with chat integration and notification
  const handleAcceptRequest = async (userId: string, userName: string) => {
    const result = await dispatch(acceptBarterRequest(userId));
    if (acceptBarterRequest.fulfilled.match(result)) {
      dispatch(addNotification({
        type: 'barter',
        message: `You accepted a barter request from ${userName}.`,
      }));
      // Auto-create chat and open it
      const chatResult = await dispatch(createChat({ userId1: 'me', userId2: userId }));
      if (createChat.fulfilled.match(chatResult)) {
        setOpenChatId(chatResult.payload.id);
      }
    } else {
      dispatch(addNotification({
        type: 'barter',
        message: `Failed to accept barter request from ${userName}.`,
      }));
    }
  };

  // Decline barter request handler with notification
  const handleDeclineRequest = async (userId: string, userName: string) => {
    const result = await dispatch(declineBarterRequest(userId));
    if (declineBarterRequest.fulfilled.match(result)) {
      dispatch(addNotification({
        type: 'barter',
        message: `You declined a barter request from ${userName}.`,
      }));
    } else {
      dispatch(addNotification({
        type: 'barter',
        message: `Failed to decline barter request from ${userName}.`,
      }));
    }
  };

  // Helper to get average rating and review count for a user
  const getUserReviewStats = (userId: string) => {
    const userReviews = reviews.filter(r => r.revieweeId === userId);
    const count = userReviews.length;
    const avg = count > 0 ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / count) : null;
    return { avg, count };
  };

  // Render request actions
  const renderRequestActions = (userId: string, userName: string) => {
    const request = getRequest(userId);
    const chatId = getChatIdForUser(userId);
    if (!request || request.direction === 'outgoing') {
      return (
        <>
          <button
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
            onClick={() => handleSendBarterRequest(userId, userName)}
            disabled={request?.status === 'pending' || request?.status === 'sent'}
          >
            {request?.status === 'pending' && 'Sending...'}
            {request?.status === 'sent' && 'Request Sent'}
            {request?.status === 'error' && 'Try Again'}
            {!request && 'Send Barter Request'}
          </button>
          {request?.status === 'error' && (
            <div className="text-red-500 text-xs mt-1">Failed to send request. Try again.</div>
          )}
          {/* Chat button for all users */}
          <button
            className="mt-2 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            onClick={() => chatId && setOpenChatId(chatId)}
            disabled={!chatId}
          >
            Chat
          </button>
          {!chatId && (
            <div className="text-xs text-gray-400 mt-1">No chat yet</div>
          )}
          {/* Schedule button for all users */}
          <button
            className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            onClick={() => setOpenScheduleUser({ id: userId, name: userName })}
          >
            Schedule
          </button>
          <button
            className="mt-2 w-full bg-yellow-100 text-yellow-800 py-1 rounded hover:bg-yellow-200 transition text-sm font-medium"
            onClick={() => setOpenReviewsUser({ id: userId, name: userName })}
          >
            View All Reviews
          </button>
        </>
      );
    }
    if (request.direction === 'incoming') {
      return (
        <div className="mt-4 flex flex-col gap-2">
          <button
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
            onClick={() => handleAcceptRequest(userId, userName)}
            disabled={request.status === 'accepted'}
          >
            {request.status === 'accepted' ? 'Accepted' : 'Accept Request'}
          </button>
          <button
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-60"
            onClick={() => handleDeclineRequest(userId, userName)}
            disabled={request.status === 'declined'}
          >
            {request.status === 'declined' ? 'Declined' : 'Decline Request'}
          </button>
          {request.status === 'error' && (
            <div className="text-red-500 text-xs mt-1">Failed to update request. Try again.</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {openChatId && <ChatWindow chatId={openChatId} onClose={() => setOpenChatId(null)} />}
      {openScheduleUser && (
        <SchedulingModal
          otherUserId={openScheduleUser.id}
          otherUserName={openScheduleUser.name}
          onClose={() => setOpenScheduleUser(null)}
        />
      )}
      {/* Reviews Modal */}
      {openReviewsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              onClick={() => setOpenReviewsUser(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-center">Reviews for {openReviewsUser.name}</h3>
            <ReviewsList userId={openReviewsUser.id} showHeader={false} />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
        <div className="w-full max-w-3xl bg-white p-8 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Skill Marketplace</h2>
          <div className="mb-6 flex justify-end">
            <select
              className="p-2 border rounded"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="">All Skills</option>
              {allSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </div>
          {loading && <div className="text-blue-500 mb-4">Loading users...</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {/* Mutual Matches Section */}
          {mutualMatches.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Mutual Matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {mutualMatches.map((user) => {
                  const { avg, count } = getUserReviewStats(user.id);
                  return (
                    <div key={user.id} className="border-2 border-blue-400 rounded-lg p-4 shadow hover:shadow-lg transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">{user.name}</span>
                        <span className="flex items-center gap-1">
                          {avg !== null ? (
                            <>
                              <span className="text-yellow-500 font-bold">★ {avg.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">({count})</span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">No reviews</span>
                          )}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Offers:</span>
                        <span className="ml-2">
                          {user.skillsOffered.map((s) => (
                            <span key={s.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">
                              {s.name}
                            </span>
                          ))}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Wants:</span>
                        <span className="ml-2">
                          {user.skillsWanted.map((s) => (
                            <span key={s.id} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-1">
                              {s.name}
                            </span>
                          ))}
                        </span>
                      </div>
                      {/* Preview card: You give X, get Y */}
                      {user.skillsWanted.length > 0 && user.skillsOffered.length > 0 && (
                        <div className="mt-4 bg-gray-100 rounded p-2 text-sm text-center">
                          <span className="font-semibold text-blue-700">You give </span>
                          <span className="font-semibold">{user.skillsWanted[0].name}</span>
                          <span className="font-semibold text-blue-700">, get </span>
                          <span className="font-semibold">{user.skillsOffered[0].name}</span>
                        </div>
                      )}
                      {renderRequestActions(user.id, user.name)}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {/* Other Users Section */}
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Other Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherUsers.map((user) => {
              const { avg, count } = getUserReviewStats(user.id);
              return (
                <div key={user.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">{user.name}</span>
                    <span className="flex items-center gap-1">
                      {avg !== null ? (
                        <>
                          <span className="text-yellow-500 font-bold">★ {avg.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({count})</span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">No reviews</span>
                      )}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Offers:</span>
                    <span className="ml-2">
                      {user.skillsOffered.map((s) => (
                        <span key={s.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">
                          {s.name}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Wants:</span>
                    <span className="ml-2">
                      {user.skillsWanted.map((s) => (
                        <span key={s.id} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-1">
                          {s.name}
                        </span>
                      ))}
                    </span>
                  </div>
                  {/* Preview card: You give X, get Y */}
                  {user.skillsWanted.length > 0 && user.skillsOffered.length > 0 && (
                    <div className="mt-4 bg-gray-100 rounded p-2 text-sm text-center">
                      <span className="font-semibold text-blue-700">You give </span>
                      <span className="font-semibold">{user.skillsWanted[0].name}</span>
                      <span className="font-semibold text-blue-700">, get </span>
                      <span className="font-semibold">{user.skillsOffered[0].name}</span>
                    </div>
                  )}
                  {renderRequestActions(user.id, user.name)}
                </div>
              );
            })}
          </div>
          {filteredUsers.length === 0 && !loading && (
            <div className="text-gray-500 text-center mt-8">No users found for this skill.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Marketplace; 