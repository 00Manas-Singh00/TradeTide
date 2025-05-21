import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../features/auth/authSlice';
import { Link } from 'react-router-dom';
import ReviewsList from '../features/reviews/ReviewsList';
import PendingReviews from '../features/reviews/PendingReviews';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const users = useAppSelector((state) => state.marketplace.users);
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const [openReviewsUser, setOpenReviewsUser] = useState<{ id: string; name: string } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'avg' | 'count'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Platform-wide stats
  const totalUsers = users.length;
  const totalReviews = reviews.length;
  const platformAvg = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : null;

  // Helper to get stats for a user
  const getUserStats = (userId: string) => {
    const userReviews = reviews.filter(r => r.revieweeId === userId);
    const count = userReviews.length;
    const avg = count > 0 ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / count) : null;
    const isTopRated = avg !== null && avg >= 4.8 && count >= 5;
    // Most-reviewed skill
    const skillCounts: Record<string, { name: string; count: number }> = {};
    userReviews.forEach(r => {
      if (!skillCounts[r.skill]) skillCounts[r.skill] = { name: r.skill, count: 0 };
      skillCounts[r.skill].count++;
    });
    const mostReviewedSkill = Object.values(skillCounts).sort((a, b) => b.count - a.count)[0]?.name || '-';
    return { avg, count, isTopRated, mostReviewedSkill };
  };

  // Sorting logic
  const sortedUsers = [...users].sort((a, b) => {
    const aStats = getUserStats(a.id);
    const bStats = getUserStats(b.id);
    if (sortBy === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortBy === 'avg') {
      return sortDir === 'asc'
        ? (aStats.avg ?? 0) - (bStats.avg ?? 0)
        : (bStats.avg ?? 0) - (aStats.avg ?? 0);
    } else if (sortBy === 'count') {
      return sortDir === 'asc' ? aStats.count - bStats.count : bStats.count - aStats.count;
    }
    return 0;
  });

  const handleSort = (col: 'name' | 'avg' | 'count') => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  // Recent reviews (latest 5)
  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-96 text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name || 'User'}!</h2>
        <p className="mb-6">This is your dashboard.</p>
        <Link
          to="/marketplace"
          className="block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mb-4"
        >
          Go to Marketplace
        </Link>
        <Link
          to="/profile"
          className="block w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-4"
        >
          Go to Profile
        </Link>
        <button
          onClick={() => dispatch(logout())}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition w-full"
        >
          Logout
        </button>
      </div>
      {/* Platform-wide Stats */}
      <div className="bg-white p-6 rounded shadow-md w-full max-w-3xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div><span className="font-semibold">Total Users:</span> {totalUsers}</div>
        <div><span className="font-semibold">Total Reviews:</span> {totalReviews}</div>
        <div><span className="font-semibold">Platform Avg Rating:</span> {platformAvg !== null ? platformAvg.toFixed(2) : 'N/A'}</div>
      </div>
      {/* Recent Reviews Section */}
      <div className="bg-white p-6 rounded shadow-md w-full max-w-3xl mb-6">
        <h3 className="text-lg font-bold mb-4">Recent Reviews</h3>
        {recentReviews.length === 0 ? (
          <div className="text-gray-500 text-sm">No reviews yet.</div>
        ) : (
          <ul className="space-y-4">
            {recentReviews.map((r) => (
              <li key={r.id} className="border rounded p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/user/${r.reviewerId}`}
                    className="font-semibold text-blue-700 hover:underline focus:outline-none"
                  >
                    {r.reviewerName}
                  </Link>
                  <span className="text-xs text-gray-500">→</span>
                  <Link
                    to={`/user/${r.revieweeId}`}
                    className="font-semibold text-green-700 hover:underline focus:outline-none"
                  >
                    {r.revieweeName}
                  </Link>
                  <span className="ml-2 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                  ))}
                  <span className="ml-2 text-xs text-gray-600">{r.skill}</span>
                </div>
                <div className="text-gray-700 text-sm">{r.comment}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Pending Reviews Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <PendingReviews limit={3} />
      </div>
      {/* Analytics Dashboard */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-3xl">
        <h3 className="text-xl font-bold mb-6 text-center">User Reputation Analytics</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b cursor-pointer" onClick={() => handleSort('name')}>
                User {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-4 border-b cursor-pointer" onClick={() => handleSort('avg')}>
                Avg Rating {sortBy === 'avg' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-4 border-b cursor-pointer" onClick={() => handleSort('count')}>
                Reviews {sortBy === 'count' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-4 border-b">Most-Reviewed Skill</th>
              <th className="py-2 px-4 border-b">Badge</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => {
              const { avg, count, isTopRated, mostReviewedSkill } = getUserStats(u.id);
              return (
                <tr key={u.id}>
                  <td className="py-2 px-4 border-b font-semibold">
                    <Link
                      to={`/user/${u.id}`}
                      className="text-blue-700 hover:underline focus:outline-none font-semibold"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b">{avg !== null ? avg.toFixed(2) : 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{count}</td>
                  <td className="py-2 px-4 border-b">{mostReviewedSkill}</td>
                  <td className="py-2 px-4 border-b">
                    {isTopRated && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Top Rated</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
    </div>
  );
};

export default Dashboard; 