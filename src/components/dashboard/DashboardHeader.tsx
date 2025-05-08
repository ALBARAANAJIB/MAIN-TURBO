
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  RefreshCw, 
  Trash2, 
  Filter, 
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid,
  List,
  CheckCheck,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

interface DashboardHeaderProps {
  totalVideos: number;
  fetchedCount: number;
  selectedCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  filter: string;
  setFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  hasSelectedItems: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalVideos,
  fetchedCount,
  selectedCount,
  isLoading,
  onRefresh,
  onDeleteSelected,
  onDeleteAll,
  onSelectAll,
  onDeselectAll,
  viewMode,
  setViewMode,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  hasSelectedItems,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    if (selectedCount > 0) {
      onDeleteSelected();
    } else {
      onDeleteAll();
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Liked Videos</h1>
          <p className="text-gray-400 text-sm">
            {isLoading ? (
              'Loading videos...'
            ) : (
              <>
                {fetchedCount > 0
                  ? `Showing ${fetchedCount} of ${totalVideos} videos`
                  : 'No videos found'}
              </>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {/* View toggle */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-md p-1 flex">
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 ${viewMode === 'grid' ? 'bg-gray-800' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 ${viewMode === 'table' ? 'bg-gray-800' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Selection dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CheckCheck className="h-4 w-4 mr-2" />
                Select
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuItem onClick={onSelectAll}>
                Select All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDeselectAll}>
                Deselect All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete dropdown */}
          <DropdownMenu
            open={showDeleteConfirmation}
            onOpenChange={setShowDeleteConfirmation}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={fetchedCount === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {selectedCount > 0 ? `Delete (${selectedCount})` : 'Delete'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuLabel className="text-red-500">
                Confirm Deletion
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              {selectedCount > 0 ? (
                <DropdownMenuItem
                  onClick={handleDeleteConfirmation}
                  className="text-red-500 focus:text-red-500"
                >
                  Yes, delete {selectedCount} videos
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleDeleteConfirmation}
                  className="text-red-500 focus:text-red-500"
                >
                  Yes, delete all videos
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Input
            placeholder="Search videos by title or channel..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-900/50 border-gray-800 h-10"
          />
          {filter && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setFilter('')}
            >
              <span className="sr-only">Clear</span>
              <span aria-hidden="true">×</span>
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-800">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="channel">Channel</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            className="h-10 w-10"
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
