
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { formatDate, formatDuration } from '../../utils/time';
import { LikedVideo } from '../../hooks/use-videos';
import { Video, Play, ExternalLink } from 'lucide-react';

interface VideoTableProps {
  videos: LikedVideo[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onPlay: (id: string) => void;
  allSelected: boolean;
  someSelected: boolean;
}

export const VideoTable = ({ 
  videos, 
  onSelect, 
  onSelectAll,
  onDeselectAll,
  onPlay, 
  allSelected,
  someSelected
}: VideoTableProps) => {
  const handleHeaderCheckboxChange = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleRowClick = (videoId: string) => {
    onPlay(videoId);
  };

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-800 hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected} 
                indeterminate={someSelected && !allSelected}
                onCheckedChange={handleHeaderCheckboxChange}
                aria-label={allSelected ? "Deselect all videos" : "Select all videos"}
              />
            </TableHead>
            <TableHead className="w-16"></TableHead>
            <TableHead>Video Details</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
            <TableHead className="text-right">Date Liked</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow 
              key={video.id} 
              className="border-gray-800 hover:bg-gray-900/50 cursor-pointer"
              onClick={() => handleRowClick(video.id)}
            >
              <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={video.selected} 
                  onCheckedChange={() => onSelect(video.id)}
                />
              </TableCell>
              <TableCell className="w-16 p-2">
                <div className="relative w-14 h-10 bg-gray-800 rounded overflow-hidden">
                  {video.snippet.thumbnails?.default ? (
                    <img 
                      src={video.snippet.thumbnails.default.url} 
                      alt={video.snippet.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Video className="absolute inset-0 m-auto text-gray-600" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-white line-clamp-1">{video.snippet.title}</p>
                </div>
              </TableCell>
              <TableCell className="text-gray-400 text-sm">
                {video.snippet.channelTitle}
              </TableCell>
              <TableCell className="hidden md:table-cell text-gray-400 text-sm">
                {video.contentDetails?.duration ? formatDuration(video.contentDetails.duration) : '–'}
              </TableCell>
              <TableCell className="text-right text-gray-400 text-sm">
                {formatDate(video.snippet.publishedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
