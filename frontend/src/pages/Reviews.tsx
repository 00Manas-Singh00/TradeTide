import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../hooks';
import type { Review } from '../features/reviews/reviewsSlice';

// Filter types
type FilterType = 'all' | 'received' | 'given';
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

const Reviews: React.FC = () => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);

  const { reviews } = useAppSelector((state) => state.reviews);
  const profile = useAppSelector((state) => state.profile);
  const currentUserId = profile.email || 'me';

  // Get unique skills for filter dropdown
  const uniqueSkills = useMemo(() => {
    const skills = new Set<string>();
    reviews.forEach(review => skills.add(review.skill));
    return Array.from(skills).sort();
  }, [reviews]);

  // Apply filters and sorting
  const filteredReviews = useMemo(() => {
    // Filter by type (received/given)
    let filtered = [...reviews];
    if (filterType === 'received') {
      filtered = filtered.filter(review => review.revieweeId === currentUserId);
    } else if (filterType === 'given') {
      filtered = filtered.filter(review => review.reviewerId === currentUserId);
    }

    // Filter by skill
    if (skillFilter) {
      filtered = filtered.filter(review => review.skill === skillFilter);
    }

    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter(review => review.rating >= minRating);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      switch (sortType) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return dateB - dateA;
      }
    });
  }, [reviews, filterType, sortType, skillFilter, minRating, currentUserId]);

  // Calculate review statistics
  const stats = useMemo(() => {
    const receivedReviews = reviews.filter(r => r.revieweeId === currentUserId);
    const totalReceived = receivedReviews.length;
    const avgRating = totalReceived > 0
      ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReceived
      : 0;
    
    const givenReviews = reviews.filter(r => r.reviewerId === currentUserId);
    const totalGiven = givenReviews.length;
    
    return { totalReceived, avgRating, totalGiven };
  }, [reviews, currentUserId]);

  // Render stars for ratings
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reviews</h1>
      
      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Review Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Reviews Received</div>
            <div className="text-2xl font-bold">{stats.totalReceived}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">
                {stats.avgRating.toFixed(1)}
              </span>
              {renderStars(Math.round(stats.avgRating))}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Reviews Given</div>
            <div className="text-2xl font-bold">{stats.totalGiven}</div>
          </div>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">
              Show
            </label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="border rounded p-2 text-sm"
            >
              <option value="all">All Reviews</option>
              <option value="received">Reviews I've Received</option>
              <option value="given">Reviews I've Given</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="border rounded p-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="skill-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <select
              id="skill-filter"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="border rounded p-2 text-sm"
            >
              <option value="">All Skills</option>
              {uniqueSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="min-rating" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Rating
            </label>
            <select
              id="min-rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="border rounded p-2 text-sm"
            >
              <option value="0">Any Rating</option>
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★☆ (4+)</option>
              <option value="3">★★★☆☆ (3+)</option>
              <option value="2">★★☆☆☆ (2+)</option>
              <option value="1">★☆☆☆☆ (1+)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          {filteredReviews.length} {filteredReviews.length === 1 ? 'Review' : 'Reviews'}
        </h2>
        
        {filteredReviews.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No reviews match your filters.</div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">
                      {review.reviewerId === currentUserId
                        ? `You reviewed ${review.revieweeName}`
                        : `${review.reviewerName} reviewed you`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()} • {review.skill}
                    </div>
                  </div>
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <div className="text-gray-700 mt-2">{review.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews; 