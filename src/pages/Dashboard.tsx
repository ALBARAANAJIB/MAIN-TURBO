
import React, { useState, useEffect } from 'react';

// Declare the chrome object globally for TypeScript
declare const chrome: any;
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/use-toast';
import { Video, Play, Trash2 } from 'lucide-react';

interface LikedVideo {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
}

// Removed unused interface VideosData

const Dashboard = () => {
  const [videos, setVideos] = useState<LikedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    // Check auth status and fetch videos when component mounts
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response: { isAuthenticated: boolean; email?: string }) => {
      if (response && response.isAuthenticated) {
        setUserEmail(response.email || 'AxelNash4@gmail.com');
      } else {
        setError('You need to log in first');
        setIsLoading(false);
      }
    });
  }, []);

  const fetchStoredVideos = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ action: 'getStoredVideos' }, (response: { videos?: { items: LikedVideo[] } }) => {
      if (chrome.runtime.lastError) {
        setError('Error fetching videos: ' + chrome.runtime.lastError.message);
        return;
      }
      if (response && response.videos && response.videos.items) {
        setVideos(response.videos.items);
        setIsLoading(false);
      } else {
        setVideos([]);
        setIsLoading(false);
      }
    });
  };

  const openDeleteDialog = () => {
    setShowDeleteDialog(true);
    setDeleteConfirmed(false);
    setDeleteCountdown(5);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmed(false);
  };

  const confirmDelete = () => {
    setDeleteConfirmed(true);
    
    // Start countdown
    const interval = setInterval(() => {
      setDeleteCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  const deleteAllVideos = () => {
    chrome.runtime.sendMessage({ action: 'deleteAllVideos' }, (response: { success?: boolean; error?: string }) => {
      if (chrome.runtime.lastError || (response && response.error)) {
        toast({
          id: `error-${Date.now()}`,
          variant: "destructive",
          title: "Error",
          description: "Failed to delete videos. Please try again."
        });
        return;
      }
      setVideos([]);
      closeDeleteDialog();
      toast({
        id: `success-${Date.now()}`,
        title: "Success",
        description: "All liked videos were removed from storage."
      });
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const openVideoInNewTab = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Liked Videos</h1>
            {userEmail && (
              <p className="text-gray-400">
                Logged in as: {userEmail}
              </p>
            )}
          </div>
          <Button 
            variant="destructive" 
            className="text-white"
            onClick={openDeleteDialog}
            disabled={videos.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading videos...</p>
          </div>
        ) : error ? (
          <div className="bg-black/30 p-6 rounded-lg">
            <p className="text-center text-red-500">{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-black/30 p-8 rounded-lg">
            <p className="text-center">No liked videos found. Use the "Fetch Liked Videos" button on YouTube to collect them.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Video Details</TableHead>
                  <TableHead className="text-right">Date Liked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow 
                    key={video.id} 
                    className="border-gray-800 hover:bg-gray-900/50"
                    onClick={() => openVideoInNewTab(video.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell className="w-12">
                      <Checkbox onClick={(e) => e.stopPropagation()} />
                    </TableCell>
                    <TableCell className="w-16">
                      <div className="relative w-12 h-12 bg-gray-800 rounded overflow-hidden">
                        {video.snippet.thumbnails?.default ? (
                          <img 
                            src={video.snippet.thumbnails.default.url} 
                            alt={video.snippet.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="absolute inset-0 m-auto text-gray-600" />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{video.snippet.title}</p>
                        <p className="text-gray-400 text-sm">{video.snippet.channelTitle}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-gray-400">
                      {formatDate(video.snippet.publishedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={closeDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete All Liked Videos</DialogTitle>
            <DialogDescription className="text-gray-400">
              You're about to delete {videos.length} liked videos from your storage.
              <br />This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!deleteConfirmed ? (
              <p className="text-white">
                Are you sure you want to proceed? This will only remove the videos from this extension's storage, not from your YouTube account.
              </p>
            ) : (
              <div>
                <p className="text-white mb-2">Please wait {deleteCountdown} seconds before deletion...</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-red-600 h-2.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${(deleteCountdown / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            {!deleteConfirmed ? (
              <Button variant="destructive" onClick={confirmDelete}>
                Yes, Delete All
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={deleteAllVideos} 
                disabled={deleteCountdown > 0}
              >
                {deleteCountdown > 0 ? `Wait ${deleteCountdown}s` : "Delete Now"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
