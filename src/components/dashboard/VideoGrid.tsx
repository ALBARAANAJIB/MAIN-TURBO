
import React from 'react';
import { VideoCard } from './VideoCard';
import { LikedVideo } from '../../hooks/use-videos';

interface VideoGridProps {
  videos: LikedVideo[];
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}

export const VideoGrid = ({ videos, onSelect, onPlay }: VideoGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onSelect={onSelect}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
};
