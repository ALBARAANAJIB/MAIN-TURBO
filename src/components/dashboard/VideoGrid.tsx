
import React from 'react';
import { VideoCard } from './VideoCard';
import { LikedVideo } from '../../hooks/use-videos';
import { motion } from 'framer-motion';

interface VideoGridProps {
  videos: LikedVideo[];
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}

export const VideoGrid = ({ videos, onSelect, onPlay }: VideoGridProps) => {
  if (videos.length === 0) {
    return <div className="text-center text-gray-400 py-8">No videos found</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <VideoCard
            video={video}
            onSelect={onSelect}
            onPlay={onPlay}
          />
        </motion.div>
      ))}
    </div>
  );
};
