
import React from 'react';
import { Button } from '../ui/button';
import { Download, RefreshCw, Youtube } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "No liked videos found", 
  onRefresh,
  isLoading = false 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-gray-900/30 rounded-lg border border-gray-800 text-center">
      <div className="bg-red-600/20 w-20 h-20 rounded-full flex items-center justify-center mb-5">
        <Youtube className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-medium text-white mb-3">{message}</h3>
      <p className="text-gray-400 mb-6 max-w-md">
        Visit YouTube and use the "Fetch Liked Videos" button to collect your liked videos,
        or click refresh to check again.
      </p>
      {onRefresh && (
        <Button onClick={onRefresh} disabled={isLoading} variant="secondary" size="lg" className="px-6">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
    </div>
  );
};
