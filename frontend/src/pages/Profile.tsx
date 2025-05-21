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
  clearProfileMessages,
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

// Add type for social link
interface SocialLink { type: string; url: string; }

// Helper to safely get string or array from possibly undefined or wrong type
function safeString(val: unknown): string { return typeof val === 'string' ? val : ''; }
function safeArray<T>(val: unknown): T[] { return Array.isArray(val) ? val : []; }

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { userId } = useParams<{ userId?: string }>();
  const marketplaceUsers = useAppSelector((state) => state.marketplace.users);
  const reviews = useAppSelector((state) => state.reviews.reviews);
  const profile = useAppSelector((state) => state.profile);
  const authUser = useAppSelector((state) => state.auth.user);
  const { loading, error, success } = profile;

  // Find user by id (from marketplace) or fallback to current user
  const user = userId
    ? marketplaceUsers.find((u) => u.id === userId)
    : authUser && {
        id: (authUser as any).id || (authUser as any)._id || (authUser as any).email,
        name: (authUser as any).name || '',
        email: (authUser as any).email || '',
        skillsOffered: safeArray<Skill>(profile.skillsOffered),
        skillsWanted: safeArray<Skill>(profile.skillsWanted),
        bio: safeString(profile.bio),
        avatarUrl: safeString(profile.avatarUrl),
        coverPhotoUrl: safeString(profile.coverPhotoUrl),
        socialLinks: safeArray<SocialLink>(profile.socialLinks),
      };

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
  const [bio, setBio] = useState(isOwnProfile ? safeString(profile.bio) : ('bio' in user ? safeString(user.bio) : ''));
  const [avatarUrl, setAvatarUrl] = useState(isOwnProfile ? safeString(profile.avatarUrl) : ('avatarUrl' in user ? safeString(user.avatarUrl) : ''));
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(isOwnProfile ? safeString(profile.coverPhotoUrl) : ('coverPhotoUrl' in user ? safeString(user.coverPhotoUrl) : ''));
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    isOwnProfile ? safeArray<SocialLink>(profile.socialLinks) : ('socialLinks' in user ? safeArray<SocialLink>(user.socialLinks) : [])
  );

  const handleSave = () => {
    dispatch(updateProfile({
      name: user.name,
      email: 'email' in user ? user.email : '',
      bio: String('bio' in user ? user.bio : ''),
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      avatarUrl,
      coverPhotoUrl,
      socialLinks,
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

  // Handler for avatar/cover upload (simulate upload, just set URL for now)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setAvatarUrl(url);
    }
  };
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setCoverPhotoUrl(url);
    }
  };
  // Social links handlers
  const handleSocialLinkChange = (idx: number, field: 'type' | 'url', value: string) => {
    setSocialLinks((links: SocialLink[]) => links.map((l: SocialLink, i: number) => i === idx ? { ...l, [field]: value } : l));
  };
  const handleAddSocialLink = () => {
    setSocialLinks((links: SocialLink[]) => [...links, { type: '', url: '' }]);
  };
  const handleRemoveSocialLink = (idx: number) => {
    setSocialLinks((links: SocialLink[]) => links.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearProfileMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="w-full max-w-xl relative mb-[-64px]">
        {coverPhotoUrl ? (
          <img src={coverPhotoUrl} alt="Cover" className="w-full h-48 object-cover rounded-t-lg" />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center text-gray-400">No Cover Photo</div>
        )}
        {isOwnProfile && (
          <label className="absolute top-2 right-2 bg-white bg-opacity-80 px-3 py-1 rounded cursor-pointer text-sm font-medium shadow">
            Change Cover
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        )}
      </div>
      {/* Avatar */}
      <div className="w-full max-w-xl flex justify-center relative z-10">
        <div className="-mt-16 mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-white object-cover shadow" />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center text-4xl text-gray-500 shadow">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 bg-white bg-opacity-80 px-2 py-1 rounded cursor-pointer text-xs font-medium shadow ml-24 mt-20">
              Change
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          )}
        </div>
      </div>
      {/* Error/Success Messages */}
      {error && (
        <div className="w-full max-w-xl mb-4 bg-red-100 text-red-700 px-4 py-2 rounded text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="w-full max-w-xl mb-4 bg-green-100 text-green-700 px-4 py-2 rounded text-center">
          {success}
        </div>
      )}
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
        {/* Social Links */}
        <div className="mb-6">
          <span className="block mb-1 font-semibold">Social Links</span>
          <div className="flex flex-col gap-2">
            {socialLinks.length === 0 && <span className="text-gray-400">No social links added.</span>}
            {socialLinks.map((link: SocialLink, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                {isOwnProfile ? (
                  <>
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Type (e.g. twitter, linkedin)"
                      value={link.type}
                      onChange={e => handleSocialLinkChange(idx, 'type', e.target.value)}
                    />
                    <input
                      className="border rounded px-2 py-1 text-sm flex-1"
                      placeholder="URL"
                      value={link.url}
                      onChange={e => handleSocialLinkChange(idx, 'url', e.target.value)}
                    />
                    <button className="text-red-500 text-xs" onClick={() => handleRemoveSocialLink(idx)}>Remove</button>
                  </>
                ) : (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    {link.type || link.url}
                  </a>
                )}
              </div>
            ))}
          </div>
          {isOwnProfile && (
            <button className="mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm" onClick={handleAddSocialLink}>
              Add Social Link
            </button>
          )}
        </div>
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