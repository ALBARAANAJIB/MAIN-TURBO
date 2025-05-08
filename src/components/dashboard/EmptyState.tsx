
import React from 'react';
import { Button } from '../ui/button';
import { Download, RefreshCw } from 'lucide-react';

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
      <div className="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <Download className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{message}</h3>
      <p className="text-gray-400 mb-6 max-w-md">
        Use the "Fetch Liked Videos" button on YouTube to collect your liked videos,
        or click refresh to check again.
      </p>
      {onRefresh && (
        <Button onClick={onRefresh} disabled={isLoading} variant="secondary">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
    </div>
  );
};
