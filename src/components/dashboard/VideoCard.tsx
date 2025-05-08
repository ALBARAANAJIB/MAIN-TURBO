
import React from 'react';
import { Checkbox } from '../ui/checkbox';
import { formatDuration } from '../../utils/time';
import { getRelativeTime } from '../../utils/time';
import { LikedVideo } from '../../hooks/use-videos';
import { Play, ExternalLink } from 'lucide-react';

interface VideoCardProps {
  video: LikedVideo;
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}

export const VideoCard = ({ video, onSelect, onPlay }: VideoCardProps) => {
  const handleCheckboxChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(video.id);
  };

  const handleCardClick = () => {
    onPlay(video.id);
  };

  // Extract video details
  const { snippet, contentDetails, selected } = video;
  const { title, channelTitle, publishedAt, thumbnails } = snippet;
  
  // Get thumbnail URL (use medium if available, otherwise default)
  const thumbnailUrl = thumbnails?.medium?.url || thumbnails?.default?.url || '';
  
  // Format duration
  const duration = contentDetails?.duration ? formatDuration(contentDetails.duration) : '';
  
  // Get relative time
  const relativeTime = getRelativeTime(publishedAt);

  return (
    <div 
      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-video bg-gray-800 overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-gray-600" />
          </div>
        )}
        
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
            {duration}
          </div>
        )}
        
        {/* Overlay play button on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
          <Checkbox 
            checked={selected} 
            onCheckedChange={() => onSelect(video.id)}
            className="bg-black/50 border-white/70 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">{title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{channelTitle}</span>
          <span>{relativeTime}</span>
        </div>
      </div>
    </div>
  );
};
