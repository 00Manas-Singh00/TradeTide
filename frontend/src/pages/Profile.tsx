import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useParams, Link } from 'react-router-dom';
import {
  fetchProfile,
  updateProfile,
  addSkillOffered,
  removeSkillOffered,
  addSkillWanted,
  removeSkillWanted,
} from '../features/profile/profileSlice';
import type { Skill } from '../features/profile/profileSlice';
import ReviewsList from '../features/reviews/ReviewsList';

// Static list of available skills
const ALL_SKILLS: Skill[] = [
  { id: '1', name: 'Digital Art' },
  { id: '2', name: 'French Lessons' },
  { id: '3', name: 'Guitar' },
  { id: '4', name: 'Web Development' },
  { id: '5', name: 'Yoga' },
  { id: '6', name: 'Cooking' },
];

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userId } = useParams<{ userId?: string }>();
  const marketplaceUsers = useAppSelector((state) => state.marketplace.users);
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const profile = useAppSelector((state) => state.profile);

  // Find user by id (from marketplace) or fallback to current user
  const user = userId
    ? marketplaceUsers.find((u) => u.id === userId)
    : { id: 'me', name: profile.name, email: profile.email, skillsOffered: profile.skillsOffered, skillsWanted: profile.skillsWanted };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">User not found.</div>;
  }
  // Use email for reviews if available, else id
  const userKey = 'email' in user && user.email ? user.email : user.id;
  const userReviews = reviews.filter(r => r.revieweeId === userKey);
  const reviewCount = userReviews.length;
  const avgRating = reviewCount > 0 ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) : null;
  const isTopRated = avgRating !== null && avgRating >= 4.8 && reviewCount >= 5;

  const isOwnProfile = !userId;
  const [bio, setBio] = useState(isOwnProfile ? profile.bio : ('bio' in user ? user.bio : ''));

  const handleSave = () => {
    dispatch(updateProfile({
      name: user.name,
      email: 'email' in user ? user.email : '',
      bio: String('bio' in user ? user.bio : ''),
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
    }));
  };

  const availableSkillsOffered = ALL_SKILLS.filter(
    (skill) => !user.skillsOffered.some((s) => s.id === skill.id)
  );
  const availableSkillsWanted = ALL_SKILLS.filter(
    (skill) => !user.skillsWanted.some((s) => s.id === skill.id)
  );

  // Find most-reviewed skill
  const skillCounts: Record<string, { name: string; count: number }> = {};
  userReviews.forEach(r => {
    if (!skillCounts[r.skill]) skillCounts[r.skill] = { name: r.skill, count: 0 };
    skillCounts[r.skill].count++;
  });
  const mostReviewedSkill = Object.values(skillCounts).sort((a, b) => b.count - a.count)[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-xl flex justify-start mb-4">
        <Link
          to="/dashboard"
          className="bg-blue-100 text-blue-800 px-4 py-2 rounded hover:bg-blue-200 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{user.name}'s Profile</h2>
        {/* Bio Section */}
        <div className="mb-6">
          <span className="block mb-1 font-semibold">About</span>
          {isOwnProfile ? (
            <textarea
              className="w-full p-2 border rounded mb-2"
              rows={3}
              value={String(bio) || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
            />
          ) : (
            <span className="block p-2 border rounded bg-gray-50 min-h-[48px]">{String(bio) || <span className='text-gray-400'>No bio yet.</span>}</span>
          )}
          {isOwnProfile && (
            <button
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              onClick={() => dispatch(updateProfile({
                name: profile.name,
                email: profile.email,
                bio: String(bio) || '',
                skillsOffered: profile.skillsOffered,
                skillsWanted: profile.skillsWanted,
              }))}
              disabled={profile.loading}
            >
              Save Bio
            </button>
          )}
        </div>
        <div className="mb-4">
          <span className="block mb-1 font-semibold">Name</span>
          <span className="block p-2 border rounded bg-gray-100">{user.name}</span>
        </div>
        {('email' in user && user.email) && (
          <div className="mb-4">
            <span className="block mb-1 font-semibold">Email</span>
            <span className="block p-2 border rounded bg-gray-100">{user.email}</span>
          </div>
        )}
        <div className="mb-6">
          <span className="block mb-1 font-semibold">Skills Offered</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {user.skillsOffered?.map((skill: any) => (
              <span key={skill.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <span className="block mb-1 font-semibold">Skills Wanted</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {user.skillsWanted?.map((skill: any) => (
              <span key={skill.id} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          onClick={handleSave}
          disabled={profile.loading}
        >
          Save Profile
        </button>
      </div>
      {/* Reputation & Analytics Section */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-xl mb-8">
        <h3 className="text-xl font-bold mb-4 text-center">Reputation & Analytics</h3>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-2xl font-bold">★</span>
            <span className="text-lg font-semibold">{avgRating !== null ? avgRating.toFixed(2) : 'N/A'}</span>
            <span className="text-gray-600">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
          </div>
          {isTopRated && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mt-2">Top Rated</span>
          )}
        </div>
        {/* Most-Reviewed Skill */}
        <div className="mt-4 text-center">
          <span className="font-semibold">Most-Reviewed Skill: </span>
          {mostReviewedSkill ? (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
              {mostReviewedSkill.name} ({mostReviewedSkill.count} review{mostReviewedSkill.count === 1 ? '' : 's'})
            </span>
          ) : (
            <span className="text-gray-400">No reviews yet.</span>
          )}
        </div>
      </div>
      {/* Reviews Section */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-xl mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">Reviews</h3>
        <ReviewsList userId={userKey} />
      </div>
    </div>
  );
};

export default Profile; 