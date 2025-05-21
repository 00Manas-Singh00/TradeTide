import React, { useState, useEffect } from 'react';
import type { Skill } from './marketplaceSlice';
import { motion } from 'framer-motion';

interface FilterPanelProps {
  allSkills: Skill[];
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

export interface FilterOptions {
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
  hasReviews: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ allSkills, onFilterChange, initialFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters || {
    skillsOffered: [],
    skillsWanted: [],
    rating: 0,
    hasReviews: false
  });

  // Apply filters when they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSkillToggle = (skillId: string, type: 'offered' | 'wanted') => {
    setFilters(prev => {
      const key = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
      const currentSkills = [...prev[key]];
      
      if (currentSkills.includes(skillId)) {
        return {
          ...prev,
          [key]: currentSkills.filter(id => id !== skillId)
        };
      } else {
        return {
          ...prev,
          [key]: [...currentSkills, skillId]
        };
      }
    });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setFilters(prev => ({
      ...prev,
      rating: value
    }));
  };

  const handleReviewsToggle = () => {
    setFilters(prev => ({
      ...prev,
      hasReviews: !prev.hasReviews
    }));
  };

  const clearFilters = () => {
    setFilters({
      skillsOffered: [],
      skillsWanted: [],
      rating: 0,
      hasReviews: false
    });
  };

  const hasActiveFilters = filters.skillsOffered.length > 0 || 
                          filters.skillsWanted.length > 0 || 
                          filters.rating > 0 || 
                          filters.hasReviews;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.96 }}
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? 'Hide filters' : 'Show filters'}
          </motion.button>
        </div>
      </div>
      
      {hasActiveFilters && !isExpanded && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.skillsOffered.map(skillId => {
            const skill = allSkills.find(s => s.id === skillId);
            return skill ? (
              <span key={`offered-${skill.id}`} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Offers: {skill.name}
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSkillToggle(skill.id, 'offered')}
                  className="ml-1 text-blue-800 hover:text-blue-600"
                >
                  ×
                </motion.button>
              </span>
            ) : null;
          })}
          {filters.skillsWanted.map(skillId => {
            const skill = allSkills.find(s => s.id === skillId);
            return skill ? (
              <span key={`wanted-${skill.id}`} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Wants: {skill.name}
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSkillToggle(skill.id, 'wanted')}
                  className="ml-1 text-green-800 hover:text-green-600"
                >
                  ×
                </motion.button>
              </span>
            ) : null;
          })}
          {filters.rating > 0 && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
              Rating: ≥ {filters.rating}★
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilters(prev => ({ ...prev, rating: 0 }))}
                className="ml-1 text-yellow-800 hover:text-yellow-600"
              >
                ×
              </motion.button>
            </span>
          )}
          {filters.hasReviews && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
              Has reviews
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleReviewsToggle}
                className="ml-1 text-purple-800 hover:text-purple-600"
              >
                ×
              </motion.button>
            </span>
          )}
        </div>
      )}
      
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Skills Offered</h4>
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {allSkills.map(skill => (
                <div key={`offered-${skill.id}`} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`offered-${skill.id}`}
                    checked={filters.skillsOffered.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id, 'offered')}
                    className="mr-2"
                  />
                  <label htmlFor={`offered-${skill.id}`} className="text-sm">
                    {skill.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Skills Wanted</h4>
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {allSkills.map(skill => (
                <div key={`wanted-${skill.id}`} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`wanted-${skill.id}`}
                    checked={filters.skillsWanted.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id, 'wanted')}
                    className="mr-2"
                  />
                  <label htmlFor={`wanted-${skill.id}`} className="text-sm">
                    {skill.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Minimum Rating</h4>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={filters.rating}
                onChange={handleRatingChange}
                className="w-full mr-2"
              />
              <span className="text-yellow-500 font-bold">{filters.rating > 0 ? `${filters.rating}★` : 'Any'}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Other Filters</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has-reviews"
                checked={filters.hasReviews}
                onChange={handleReviewsToggle}
                className="mr-2"
              />
              <label htmlFor="has-reviews" className="text-sm">
                Has reviews
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 