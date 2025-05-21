import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import FilterPanel from '../features/marketplace/FilterPanel';
import type { FilterOptions } from '../features/marketplace/FilterPanel';
import SortOptions from '../features/marketplace/SortOptions';
import type { SortOption } from '../features/marketplace/SortOptions';
import { motion, AnimatePresence } from 'framer-motion';

const Marketplace: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error, barterRequests, allSkills } = useAppSelector((state) => state.marketplace);
  const { skillsOffered: mySkillsOffered, skillsWanted: mySkillsWanted } = useAppSelector((state) => state.profile);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [openScheduleUser, setOpenScheduleUser] = useState<{ id: string; name: string } | null>(null);
  const { chats } = useAppSelector((state) => state.chat);
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const [openReviewsUser, setOpenReviewsUser] = useState<{ id: string; name: string } | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    skillsOffered: [],
    skillsWanted: [],
    rating: 0,
    hasReviews: false
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [sortOption, setSortOption] = useState<SortOption>('matchQuality');

  // Initial fetch of users when component mounts
  useEffect(() => {
    dispatch(fetchMarketplaceUsers());
  }, [dispatch]);

  // Debounce filter changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(timerId);
    };
  }, [filters]);

  // Fetch users when debounced filters change
  useEffect(() => {
    // Only send API filter parameters if they have values
    const apiParams: { skillsOffered?: string[], skillsWanted?: string[] } = {};
    
    if (debouncedFilters.skillsOffered.length > 0) {
      apiParams.skillsOffered = debouncedFilters.skillsOffered;
    }
    
    if (debouncedFilters.skillsWanted.length > 0) {
      apiParams.skillsWanted = debouncedFilters.skillsWanted;
    }
    
    if (Object.keys(apiParams).length > 0) {
      dispatch(fetchMarketplaceUsers(apiParams));
    }
  }, [dispatch, debouncedFilters]);

  // Apply client-side filters for rating and hasReviews
  const applyClientSideFilters = (users: MarketplaceUser[]) => {
    return users.filter(user => {
      const { avg, count } = getUserReviewStats(user.id);
      
      // Filter by minimum rating
      if (filters.rating > 0 && (avg === null || avg < filters.rating)) {
        return false;
      }
      
      // Filter by has reviews
      if (filters.hasReviews && count === 0) {
        return false;
      }
      
      return true;
    });
  };

  // Helper to get average rating and review count for a user
  const getUserReviewStats = (userId: string) => {
    const userReviews = reviews.filter(r => r.revieweeId === userId);
    const count = userReviews.length;
    const avg = count > 0 ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / count) : null;
    return { avg, count };
  };

  // Calculate match quality score between current user and another user
  const calculateMatchQuality = useCallback((user: MarketplaceUser) => {
    // You offer a skill they want
    const youOfferTheyWant = mySkillsOffered.filter((mySkill) =>
      user.skillsWanted.some((theirWant) => theirWant.id === mySkill.id)
    ).length;
    
    // They offer a skill you want
    const theyOfferYouWant = user.skillsOffered.filter((theirSkill) =>
      mySkillsWanted.some((myWant) => myWant.id === theirSkill.id)
    ).length;
    
    // Calculate match quality score (0-100)
    const totalPossibleMatches = Math.max(1, mySkillsOffered.length + user.skillsOffered.length);
    const matchScore = ((youOfferTheyWant + theyOfferYouWant) / totalPossibleMatches) * 100;
    
    return matchScore;
  }, [mySkillsOffered, mySkillsWanted]);

  // Mutual match logic
  const isMutualMatch = useCallback((user: MarketplaceUser) => {
    // You offer a skill they want
    const youOfferTheyWant = mySkillsOffered.some((mySkill) =>
      user.skillsWanted.some((theirWant) => theirWant.id === mySkill.id)
    );
    // They offer a skill you want
    const theyOfferYouWant = user.skillsOffered.some((theirSkill) =>
      mySkillsWanted.some((myWant) => myWant.id === theirSkill.id)
    );
    return youOfferTheyWant && theyOfferYouWant;
  }, [mySkillsOffered, mySkillsWanted]);

  // Apply sorting to users
  const sortUsers = useCallback((users: MarketplaceUser[]) => {
    return [...users].sort((a, b) => {
      switch (sortOption) {
        case 'rating':
          const aRating = getUserReviewStats(a.id).avg || 0;
          const bRating = getUserReviewStats(b.id).avg || 0;
          return bRating - aRating; // Descending order
          
        case 'matchQuality':
          const aQuality = calculateMatchQuality(a);
          const bQuality = calculateMatchQuality(b);
          return bQuality - aQuality; // Descending order
          
        case 'newest':
          // In a real app, we would use creation date
          // For now, just use the user ID as a proxy
          return parseInt(b.id.replace('u', ''), 10) - parseInt(a.id.replace('u', ''), 10);
          
        case 'alphabetical':
          return a.name.localeCompare(b.name);
          
        default:
          return 0;
      }
    });
  }, [sortOption, getUserReviewStats, calculateMatchQuality]);

  // Filter and sort users
  const processedUsers = useMemo(() => {
    const filteredUsers = applyClientSideFilters(users);
    return sortUsers(filteredUsers);
  }, [users, applyClientSideFilters, sortUsers]);

  // Split users into mutual matches and others
  const mutualMatches = useMemo(() => processedUsers.filter(isMutualMatch), [processedUsers, isMutualMatch]);
  const otherUsers = useMemo(() => processedUsers.filter(user => !isMutualMatch(user)), [processedUsers, isMutualMatch]);

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
    // Use the first skill you offer as the barter skill
    const mySkill = mySkillsOffered[0]?.name || '';
    if (!mySkill) {
      dispatch(addNotification({
        type: 'barter',
        message: 'You must add a skill you offer to send a barter request.',
      }));
      return;
    }
    const result = await dispatch(sendBarterRequest({ receiverId: userId, skill: mySkill }));
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
      const chatResult = await dispatch(createChat(userId));
      if (createChat.fulfilled.match(chatResult)) {
        setOpenChatId(chatResult.payload._id);
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

  // Handle filter changes from the FilterPanel
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Handle sort option changes
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  // Add a handler for chat button
  const handleChatButton = async (userId: string) => {
    const chatId = getChatIdForUser(userId);
    if (chatId) {
      setOpenChatId(chatId);
    } else {
      const chatResult = await dispatch(createChat(userId));
      if (createChat.fulfilled.match(chatResult)) {
        setOpenChatId(chatResult.payload._id);
      }
    }
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
            onClick={() => handleChatButton(userId)}
            disabled={false}
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

  // Render match quality indicator
  const renderMatchQuality = (user: MarketplaceUser) => {
    const matchScore = calculateMatchQuality(user);
    let matchClass = 'bg-gray-100 text-gray-600';
    
    if (matchScore >= 90) {
      matchClass = 'bg-[var(--orange)] text-white';
    } else if (matchScore >= 75) {
      matchClass = 'bg-green-100 text-green-800';
    } else if (matchScore >= 50) {
      matchClass = 'bg-blue-100 text-blue-800';
    } else if (matchScore >= 25) {
      matchClass = 'bg-yellow-100 text-yellow-800';
    }
    
    return (
      <div className={`text-xs px-2 py-1 rounded-full ${matchClass} flex items-center gap-1`}>
        <span className="font-medium">Match:</span> {Math.round(matchScore)}%
      </div>
    );
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
          
          {/* Advanced Filter Panel */}
          <FilterPanel 
            allSkills={allSkills} 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
          
          {/* Sort Options */}
          <div className="mb-6">
            <SortOptions currentSort={sortOption} onSortChange={handleSortChange} />
          </div>
          
          {loading && <div className="text-blue-500 mb-4">Loading users...</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {/* Mutual Matches Section */}
          {mutualMatches.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Mutual Matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-[var(--teal-light)] rounded-lg p-4">
                <AnimatePresence>
                  {mutualMatches.map((user) => {
                    const { avg, count } = getUserReviewStats(user.id);
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ duration: 0.4 }}
                        className="border-2 border-blue-400 rounded-lg p-4 shadow hover:shadow-lg transition bg-white"
                      >
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
                          {renderMatchQuality(user)}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Offers:</span>
                          <span className="ml-2">
                            {user.skillsOffered.map((s) => (
                              <span key={s.id} style={{ background: 'var(--teal)', color: 'white' }} className="px-2 py-1 rounded-full text-xs mr-1">
                                {s.name}
                              </span>
                            ))}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Wants:</span>
                          <span className="ml-2">
                            {user.skillsWanted.map((s) => (
                              <span key={s.id} style={{ background: 'var(--pink)', color: 'white' }} className="px-2 py-1 rounded-full text-xs mr-1">
                                {s.name}
                              </span>
                            ))}
                          </span>
                        </div>
                        {/* Preview card: You give X, get Y */}
                        {user.skillsWanted.length > 0 && user.skillsOffered.length > 0 && (
                          <div className="mt-4 rounded p-2 text-sm text-center" style={{ background: 'var(--accent)', color: 'white' }}>
                            <span className="font-semibold text-blue-100">You give </span>
                            <span className="font-semibold">{user.skillsWanted[0].name}</span>
                            <span className="font-semibold text-blue-100">, get </span>
                            <span className="font-semibold">{user.skillsOffered[0].name}</span>
                          </div>
                        )}
                        {renderRequestActions(user.id, user.name)}
                        <button
                          className="mt-2 w-full py-1 rounded transition text-sm font-medium"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}
                          onClick={() => setOpenReviewsUser({ id: user.id, name: user.name })}
                        >
                          View All Reviews
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
          {/* Other Users Section */}
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Other Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--teal-light)] rounded-lg p-4">
            <AnimatePresence>
              {otherUsers.map((user) => {
                const { avg, count } = getUserReviewStats(user.id);
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ duration: 0.4 }}
                    className="border rounded-lg p-4 shadow hover:shadow-lg transition"
                  >
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
                      {renderMatchQuality(user)}
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
                      <div className="mt-4 rounded p-2 text-sm text-center" style={{ background: 'var(--accent)', color: 'white' }}>
                        <span className="font-semibold text-blue-100">You give </span>
                        <span className="font-semibold">{user.skillsWanted[0].name}</span>
                        <span className="font-semibold text-blue-100">, get </span>
                        <span className="font-semibold">{user.skillsOffered[0].name}</span>
                      </div>
                    )}
                    {renderRequestActions(user.id, user.name)}
                    <button
                      className="mt-2 w-full py-1 rounded transition text-sm font-medium"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}
                      onClick={() => setOpenReviewsUser({ id: user.id, name: user.name })}
                    >
                      View All Reviews
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {processedUsers.length === 0 && !loading && (
            <div className="text-gray-500 text-center mt-8">No users found with the selected filters.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Marketplace; 