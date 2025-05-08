// YouTube API credentials and endpoints
const CLIENT_ID = '304162096302-c470kd77du16s0lrlumobc6s8u6uleng.apps.googleusercontent.com';
const REDIRECT_URI = chrome.identity.getRedirectURL();
const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl',
                'https://www.googleapis.com/auth/userinfo.email'];

// Token storage keys
const TOKEN_STORAGE_KEY = 'youtube_enhancer_token';
const TOKEN_EXPIRY_KEY = 'youtube_enhancer_token_expiry';
const USER_EMAIL_KEY = 'youtube_enhancer_email';
const LIKED_VIDEOS_KEY = 'youtube_enhancer_liked_videos';
const NEXT_PAGE_TOKEN_KEY = 'youtube_enhancer_next_page_token';
const TOTAL_RESULTS_KEY = 'youtube_enhancer_total_results';

// Authentication status
let isAuthenticated = false;

// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Enhancer extension installed');
  checkAuthStatus();
});

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.action === 'authenticate') {
    authenticateUser().then(result => {
      sendResponse({ success: result });
    });
    return true; // Keep the message channel open for async response
  }
  
  else if (request.action === 'checkAuth') {
    checkAuthStatus().then(status => {
      // Get user email and send back with auth status
      getUserEmail().then(email => {
        sendResponse({ isAuthenticated: status, email: email });
      });
    });
    return true;
  }
  
  else if (request.action === 'logout') {
    logoutUser().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  else if (request.action === 'getLikedVideos') {
    getLikedVideos().then(videos => {
      // Store videos in local storage for dashboard access
      storeVideos(videos).then(() => {
        sendResponse({ videos });
      });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
  
  else if (request.action === 'getMoreLikedVideos') {
    const { pageToken } = request;
    getMoreLikedVideos(pageToken).then(result => {
      // Update stored videos with new batch
      updateStoredVideos(result.videos).then(() => {
        sendResponse({ 
          videos: result.videos,
          nextPageToken: result.nextPageToken,
          totalResults: result.totalResults
        });
      });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
  
  else if (request.action === 'getStoredVideos') {
    getStoredVideos().then(result => {
      sendResponse(result);
    });
    return true;
  }
  
  else if (request.action === 'deleteVideos') {
    const { videoIds } = request;
    deleteVideos(videoIds).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
  
  else if (request.action === 'deleteAllVideos') {
    deleteAllVideos().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
  
  else if (request.action === 'openDashboard') {
    // Use the dashboard.html in public folder instead of index.html
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    sendResponse({ success: true });
    return true;
  }
  
  else if (request.action === 'updateAuthUI') {
    // This action will be used to update the popup UI based on auth status
    checkAuthStatus().then(status => {
      getUserEmail().then(email => {
        sendResponse({ isAuthenticated: status, email: email });
      });
    });
    return true;
  }
  
  else if (request.action === 'pageChanged' || request.action === 'pageLoaded') {
    // Handle page navigation events from content script
    console.log(`Page ${request.action === 'pageChanged' ? 'changed to' : 'loaded'}: ${request.url}`);
    
    // We could do something with this information if needed
    // For now, we're just acknowledging receipt
    sendResponse({ received: true });
    return true;
  }
});

// Check authentication status
async function checkAuthStatus() {
  try {
    const token = await getStoredToken();
    const expiry = await getStoredTokenExpiry();
    
    // Check if token exists and is not expired
    if (token && expiry && Date.now() < expiry) {
      isAuthenticated = true;
      console.log('User is authenticated');
    } else {
      isAuthenticated = false;
      console.log('User is not authenticated or token expired');
      // Clear expired token
      if (token) {
        await logoutUser();
      }
    }
    
    return isAuthenticated;
  } catch (error) {
    console.error('Error checking auth status:', error);
    isAuthenticated = false;
    return false;
  }
}

// Authenticate user with YouTube OAuth
async function authenticateUser() {
  try {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(SCOPES.join(' '))}&login_hint=AxelNash4@gmail.com`;
    
    console.log('Starting authentication flow with URL:', authUrl);
    
    const responseUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, (redirectUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(redirectUrl);
        }
      });
    });
    
    console.log('Auth flow completed, parsing response URL...');
    
    // Parse the access token from the redirect URL
    const urlParams = new URLSearchParams(responseUrl.split('#')[1]);
    const accessToken = urlParams.get('access_token');
    const expiresIn = urlParams.get('expires_in');
    
    if (!accessToken) {
      throw new Error('No access token found in the response');
    }
    
    // Calculate token expiry time (current time + expires_in seconds)
    const expiryTime = Date.now() + (parseInt(expiresIn) * 1000);
    
    // Store token and expiry
    await storeToken(accessToken);
    await storeTokenExpiry(expiryTime);
    
    // Get user info and store email
    await fetchAndStoreUserEmail(accessToken);
    
    isAuthenticated = true;
    console.log('Authentication successful');
    
    // Notify popup about successful authentication
    chrome.runtime.sendMessage({ action: 'authStatus', isAuthenticated: true, email: await getUserEmail() });
    
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    isAuthenticated = false;
    return false;
  }
}

// Logout user
async function logoutUser() {
  try {
    // Clear stored credentials and videos
    await chrome.storage.local.remove([
      TOKEN_STORAGE_KEY, 
      TOKEN_EXPIRY_KEY, 
      USER_EMAIL_KEY, 
      LIKED_VIDEOS_KEY,
      NEXT_PAGE_TOKEN_KEY,
      TOTAL_RESULTS_KEY
    ]);
    
    isAuthenticated = false;
    console.log('User logged out successfully');
    
    // Notify popup about logout
    chrome.runtime.sendMessage({ action: 'authStatus', isAuthenticated: false });
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// Get liked videos from YouTube API - first page
async function getLikedVideos() {
  try {
    if (!isAuthenticated) {
      await checkAuthStatus();
      if (!isAuthenticated) {
        throw new Error('User is not authenticated');
      }
    }
    
    const token = await getStoredToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    console.log('Fetching liked videos (first page)...');
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&myRating=like&maxResults=50`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Liked videos fetched:', data);
    
    // Store the next page token if available
    if (data.nextPageToken) {
      await storeNextPageToken(data.nextPageToken);
    } else {
      // Clear next page token if there isn't one
      await chrome.storage.local.remove(NEXT_PAGE_TOKEN_KEY);
    }
    
    // Store total results count
    if (data.pageInfo && data.pageInfo.totalResults) {
      await storeTotalResults(data.pageInfo.totalResults);
    }
    
    return data.items || [];
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    
    // If the error is due to expired token, attempt to re-authenticate
    if (error.message && error.message.includes('401')) {
      isAuthenticated = false;
      chrome.runtime.sendMessage({ action: 'authStatus', isAuthenticated: false, reason: 'token_expired' });
    }
    
    throw error;
  }
}

// Get additional pages of liked videos
async function getMoreLikedVideos(pageToken) {
  try {
    if (!isAuthenticated) {
      await checkAuthStatus();
      if (!isAuthenticated) {
        throw new Error('User is not authenticated');
      }
    }
    
    const token = await getStoredToken();
    if (!token) {
      throw new Error('No access token found');
    }
    
    if (!pageToken) {
      // If no page token provided, try to get from storage
      pageToken = await getStoredNextPageToken();
      
      if (!pageToken) {
        throw new Error('No more videos to fetch');
      }
    }
    
    console.log('Fetching more liked videos with page token:', pageToken);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&myRating=like&maxResults=50&pageToken=${pageToken}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Additional liked videos fetched:', data);
    
    // Store the next page token if available
    if (data.nextPageToken) {
      await storeNextPageToken(data.nextPageToken);
    } else {
      // Clear next page token if there isn't one
      await chrome.storage.local.remove(NEXT_PAGE_TOKEN_KEY);
    }
    
    return {
      videos: data.items || [],
      nextPageToken: data.nextPageToken || null,
      totalResults: data.pageInfo ? data.pageInfo.totalResults : null
    };
  } catch (error) {
    console.error('Error fetching more liked videos:', error);
    
    // If the error is due to expired token, attempt to re-authenticate
    if (error.message && error.message.includes('401')) {
      isAuthenticated = false;
      chrome.runtime.sendMessage({ action: 'authStatus', isAuthenticated: false, reason: 'token_expired' });
    }
    
    throw error;
  }
}

// Store videos in local storage
async function storeVideos(videos) {
  try {
    // Add fetch timestamp to the videos data
    const videosData = {
      items: videos,
      fetchedAt: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ [LIKED_VIDEOS_KEY]: videosData });
    console.log('Videos stored in local storage');
    return true;
  } catch (error) {
    console.error('Error storing videos:', error);
    return false;
  }
}

// Update stored videos by adding more
async function updateStoredVideos(newVideos) {
  try {
    // Get existing videos
    const existingData = await getStoredVideos();
    const existingVideos = existingData.items || [];
    
    // Combine existing and new videos
    const combinedVideos = [...existingVideos, ...newVideos];
    
    // Add fetch timestamp to the videos data
    const videosData = {
      items: combinedVideos,
      fetchedAt: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ [LIKED_VIDEOS_KEY]: videosData });
    console.log('Updated videos stored in local storage');
    return true;
  } catch (error) {
    console.error('Error updating stored videos:', error);
    return false;
  }
}

// Get stored videos from local storage
async function getStoredVideos() {
  return new Promise((resolve) => {
    chrome.storage.local.get([LIKED_VIDEOS_KEY, NEXT_PAGE_TOKEN_KEY, TOTAL_RESULTS_KEY], (result) => {
      resolve({
        videos: result[LIKED_VIDEOS_KEY] || { items: [] },
        nextPageToken: result[NEXT_PAGE_TOKEN_KEY] || null,
        totalResults: result[TOTAL_RESULTS_KEY] || 0
      });
    });
  });
}

// Delete specific videos (remove from storage)
async function deleteVideos(videoIds) {
  try {
    if (!videoIds || videoIds.length === 0) {
      throw new Error('No video IDs provided');
    }
    
    // Get existing videos
    const existingData = await getStoredVideos();
    const existingVideos = existingData.videos.items || [];
    
    // Filter out the videos to be deleted
    const filteredVideos = existingVideos.filter(video => !videoIds.includes(video.id));
    
    // Update storage with filtered videos
    const videosData = {
      items: filteredVideos,
      fetchedAt: new Date().toISOString()
    };
    
    await chrome.storage.local.set({ [LIKED_VIDEOS_KEY]: videosData });
    console.log(`Deleted ${videoIds.length} videos from storage`);
    return true;
  } catch (error) {
    console.error('Error deleting videos:', error);
    throw error;
  }
}

// Delete all liked videos (clear from storage)
async function deleteAllVideos() {
  try {
    await chrome.storage.local.remove(LIKED_VIDEOS_KEY);
    console.log('All videos deleted from storage');
    return true;
  } catch (error) {
    console.error('Error deleting videos:', error);
    throw error;
  }
}

// Helper function to fetch and store user email
async function fetchAndStoreUserEmail(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store the email - use the specified email if available
    const email = data.email || 'AxelNash4@gmail.com';
    await storeUserEmail(email);
    
    return email;
  } catch (error) {
    console.error('Error fetching user email:', error);
    // Fall back to the specified email
    await storeUserEmail('AxelNash4@gmail.com');
    return 'AxelNash4@gmail.com';
  }
}

// Storage helper functions
function storeToken(token) {
  return chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: token });
}

async function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(TOKEN_STORAGE_KEY, (result) => {
      resolve(result[TOKEN_STORAGE_KEY]);
    });
  });
}

function storeTokenExpiry(expiryTime) {
  return chrome.storage.local.set({ [TOKEN_EXPIRY_KEY]: expiryTime });
}

async function getStoredTokenExpiry() {
  return new Promise((resolve) => {
    chrome.storage.local.get(TOKEN_EXPIRY_KEY, (result) => {
      resolve(result[TOKEN_EXPIRY_KEY]);
    });
  });
}

function storeUserEmail(email) {
  return chrome.storage.local.set({ [USER_EMAIL_KEY]: email });
}

async function getUserEmail() {
  return new Promise((resolve) => {
    chrome.storage.local.get(USER_EMAIL_KEY, (result) => {
      resolve(result[USER_EMAIL_KEY] || 'AxelNash4@gmail.com');
    });
  });
}

function storeNextPageToken(token) {
  return chrome.storage.local.set({ [NEXT_PAGE_TOKEN_KEY]: token });
}

async function getStoredNextPageToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(NEXT_PAGE_TOKEN_KEY, (result) => {
      resolve(result[NEXT_PAGE_TOKEN_KEY]);
    });
  });
}

function storeTotalResults(count) {
  return chrome.storage.local.set({ [TOTAL_RESULTS_KEY]: count });
}
