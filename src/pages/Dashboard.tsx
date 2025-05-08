
import React, { useState } from 'react';
import { useVideos } from '../hooks/use-videos';
import { toast } from '../hooks/use-toast';
import { checkAuth } from '../utils/extension';
import { VideoGrid } from '../components/dashboard/VideoGrid';
import { VideoTable } from '../components/dashboard/VideoTable';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { EmptyState } from '../components/dashboard/EmptyState';
import { LoadingState } from '../components/dashboard/LoadingState';
import { Button } from '../components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [userEmail, setUserEmail] = useState<string>('AxelNash4@gmail.com');
  
  // Check authentication on mount
  React.useEffect(() => {
    const verifyAuth = async () => {
      const auth = await checkAuth();
      if (auth.isAuthenticated) {
        setUserEmail(auth.email || 'AxelNash4@gmail.com');
      }
    };
    
    verifyAuth();
  }, []);

  // Use our custom hook to manage videos
  const {
    videos,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalVideos,
    fetchedCount,
    loadMore,
    refresh,
    toggleSelectVideo,
    selectAll,
    deselectAll,
    deleteSelected,
    deleteAll,
    selectedCount,
    filter,
    setFilter,
    filteredVideos,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection
  } = useVideos();

  // Open video in new tab
  const handlePlayVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  // Check if all filtered videos are selected
  const allSelected = filteredVideos.length > 0 && filteredVideos.every(video => video.selected);
  const someSelected = filteredVideos.some(video => video.selected);

  return (
    <div className="bg-black text-white min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* User info */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">YouTube Enhancer</h1>
            {userEmail && (
              <p className="text-gray-400">
                Logged in as: {userEmail}
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="bg-black/30 p-6 rounded-lg">
            <p className="text-center text-red-500">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={refresh}>Try Again</Button>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <EmptyState onRefresh={refresh} />
        ) : (
          <div className="space-y-6">
            {/* Dashboard header with controls */}
            <DashboardHeader
              totalVideos={totalVideos}
              fetchedCount={fetchedCount}
              selectedCount={selectedCount}
              isLoading={isLoading}
              onRefresh={refresh}
              onDeleteSelected={deleteSelected}
              onDeleteAll={deleteAll}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filter={filter}
              setFilter={setFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              hasSelectedItems={selectedCount > 0}
            />

            {/* No results message */}
            {filteredVideos.length === 0 && (
              <EmptyState 
                message="No videos match your search" 
                onRefresh={() => setFilter('')}
              />
            )}

            {/* Videos display (grid or table) */}
            {filteredVideos.length > 0 && (
              viewMode === 'grid' ? (
                <VideoGrid
                  videos={filteredVideos}
                  onSelect={toggleSelectVideo}
                  onPlay={handlePlayVideo}
                />
              ) : (
                <VideoTable
                  videos={filteredVideos}
                  onSelect={toggleSelectVideo}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  onPlay={handlePlayVideo}
                  allSelected={allSelected}
                  someSelected={someSelected}
                />
              )
            )}

            {/* Load more / pagination */}
            {hasMore && filteredVideos.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={loadMore} 
                  disabled={isLoadingMore}
                  variant="outline"
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Loading...
                    </>
                  ) : (
                    <>Load More Videos</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
