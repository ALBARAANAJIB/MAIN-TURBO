
import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-800 rounded animate-pulse mt-2"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-9 w-24 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 bg-gray-800 rounded animate-pulse"></div>

      {/* Video grid/table skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg overflow-hidden">
              <div className="w-full aspect-video bg-gray-800 animate-pulse"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse mt-2"></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
