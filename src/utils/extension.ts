
// Utility functions to safely interact with Chrome extension APIs

/**
 * Safe wrapper for chrome.runtime.sendMessage that works in both extension context and dev environment
 */
export const sendExtensionMessage = async <T = any>(message: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response as T);
        });
      } else {
        // In development environment, return mock data
        console.log('Development environment: Mock response for', message);
        
        // Mock responses based on message action
        if (message.action === 'checkAuth') {
          resolve({ isAuthenticated: true, email: 'AxelNash4@gmail.com' } as unknown as T);
        }
        else if (message.action === 'getStoredVideos') {
          resolve({ 
            videos: { items: [] },
            nextPageToken: null,
            totalResults: 0
          } as unknown as T);
        }
        else {
          resolve({ success: true } as unknown as T);
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Check if the app is running in extension context
 */
export const isExtensionContext = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
};

/**
 * Open dashboard in extension
 */
export const openDashboard = async (): Promise<void> => {
  if (isExtensionContext()) {
    await sendExtensionMessage({ action: 'openDashboard' });
  } else {
    // In development, just log
    console.log('Development: Would open dashboard in extension');
  }
};

/**
 * Check authentication status
 */
export const checkAuth = async () => {
  try {
    return await sendExtensionMessage<{ isAuthenticated: boolean; email: string }>({ action: 'checkAuth' });
  } catch (err) {
    console.error('Error checking auth:', err);
    return { isAuthenticated: false, email: '' };
  }
};

/**
 * Get stored videos
 */
export const getStoredVideos = async () => {
  try {
    return await sendExtensionMessage({ action: 'getStoredVideos' });
  } catch (err) {
    console.error('Error getting stored videos:', err);
    return { videos: { items: [] }, nextPageToken: null, totalResults: 0 };
  }
};

/**
 * Get more liked videos (next page)
 */
export const getMoreVideos = async (pageToken: string) => {
  try {
    return await sendExtensionMessage({ action: 'getMoreLikedVideos', pageToken });
  } catch (err) {
    console.error('Error getting more videos:', err);
    return { videos: [], nextPageToken: null, totalResults: 0 };
  }
};

/**
 * Delete videos
 */
export const deleteVideos = async (videoIds: string[]) => {
  try {
    return await sendExtensionMessage({ action: 'deleteVideos', videoIds });
  } catch (err) {
    console.error('Error deleting videos:', err);
    throw err;
  }
};

/**
 * Delete all videos
 */
export const deleteAllVideos = async () => {
  try {
    return await sendExtensionMessage({ action: 'deleteAllVideos' });
  } catch (err) {
    console.error('Error deleting all videos:', err);
    throw err;
  }
};
