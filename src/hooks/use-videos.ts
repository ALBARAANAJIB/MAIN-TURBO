
import { useState, useEffect, useCallback } from 'react';
import { getStoredVideos, getMoreVideos, deleteVideos, deleteAllVideos } from '../utils/extension';
import { toast } from '../hooks/use-toast';

export interface LikedVideo {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default: {
        url: string;
      };
      medium?: {
        url: string;
      };
    };
  };
  contentDetails?: {
    duration: string;
  };
  selected?: boolean;
}

interface UseVideosResult {
  videos: LikedVideo[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalVideos: number;
  fetchedCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleSelectVideo: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  deleteSelected: () => Promise<void>;
  deleteAll: () => Promise<void>;
  selectedCount: number;
  filter: string;
  setFilter: (filter: string) => void;
  filteredVideos: LikedVideo[];
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

export const useVideos = (): UseVideosResult => {
  const [videos, setVideos] = useState<LikedVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalVideos, setTotalVideos] = useState<number>(0);
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  // Filter and sort videos
  const filteredVideos = useCallback(() => {
    // Apply filter
    let result = videos;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = videos.filter(
        video => 
          video.snippet.title.toLowerCase().includes(lowerFilter) || 
          video.snippet.channelTitle.toLowerCase().includes(lowerFilter)
      );
    }

    // Apply sorting
    return [...result].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime();
      } else if (sortBy === 'title') {
        comparison = a.snippet.title.localeCompare(b.snippet.title);
      } else if (sortBy === 'channel') {
        comparison = a.snippet.channelTitle.localeCompare(b.snippet.channelTitle);
      }
      
      return sortDirection === 'asc' ? comparison * -1 : comparison;
    });
  }, [videos, filter, sortBy, sortDirection]);

  // Fetch initial videos
  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getStoredVideos();
      
      if (response.videos && response.videos.items) {
        const enhancedVideos = response.videos.items.map(video => ({
          ...video,
          selected: false
        }));
        setVideos(enhancedVideos);
      } else {
        setVideos([]);
      }
      
      setNextPageToken(response.nextPageToken);
      setTotalVideos(response.totalResults || 0);
    } catch (err: any) {
      setError(`Failed to fetch videos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more videos
  const loadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const response = await getMoreVideos(nextPageToken);
      
      if (response.videos && response.videos.length > 0) {
        const enhancedVideos = response.videos.map(video => ({
          ...video,
          selected: false
        }));
        setVideos(prevVideos => [...prevVideos, ...enhancedVideos]);
      }
      
      setNextPageToken(response.nextPageToken);
      setTotalVideos(response.totalResults || totalVideos);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error loading more videos",
        description: err.message
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Refresh video data
  const refresh = async () => {
    await fetchVideos();
  };

  // Toggle video selection
  const toggleSelectVideo = (id: string) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === id ? { ...video, selected: !video.selected } : video
      )
    );
  };

  // Select all videos
  const selectAll = () => {
    setVideos(prevVideos => 
      prevVideos.map(video => ({ ...video, selected: true }))
    );
  };

  // Deselect all videos
  const deselectAll = () => {
    setVideos(prevVideos => 
      prevVideos.map(video => ({ ...video, selected: false }))
    );
  };

  // Delete selected videos
  const deleteSelected = async () => {
    const selectedIds = videos
      .filter(video => video.selected)
      .map(video => video.id);
    
    if (selectedIds.length === 0) {
      toast({
        title: "No videos selected",
        description: "Please select videos to delete"
      });
      return;
    }
    
    try {
      await deleteVideos(selectedIds);
      
      // Update local state
      setVideos(prevVideos => 
        prevVideos.filter(video => !video.selected)
      );
      
      toast({
        title: "Success",
        description: `${selectedIds.length} videos deleted`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting videos",
        description: err.message
      });
    }
  };

  // Delete all videos
  const deleteAll = async () => {
    try {
      await deleteAllVideos();
      setVideos([]);
      toast({
        title: "Success",
        description: "All videos deleted"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting videos",
        description: err.message
      });
    }
  };

  // Count selected videos
  const selectedCount = videos.filter(video => video.selected).length;

  return {
    videos,
    isLoading,
    isLoadingMore,
    error,
    hasMore: !!nextPageToken,
    totalVideos,
    fetchedCount: videos.length,
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
    filteredVideos: filteredVideos(),
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection
  };
};
