import React from 'react';

export type SortOption = 'rating' | 'matchQuality' | 'newest' | 'alphabetical';

interface SortOptionsProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SortOptions: React.FC<SortOptionsProps> = ({ currentSort, onSortChange }) => {
  const options: { value: SortOption; label: string }[] = [
    { value: 'matchQuality', label: 'Best Match' },
    { value: 'rating', label: 'Highest Rating' },
    { value: 'newest', label: 'Newest First' },
    { value: 'alphabetical', label: 'A-Z' },
  ];

  return (
    <div className="flex items-center mb-4">
      <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`px-3 py-1 text-sm rounded-full transition ${
              currentSort === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortOptions; 