
// Content script for YouTube Enhancer
console.log('YouTube Enhancer content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'checkYouTubePage') {
    // Check if we're on a YouTube page
    const isYouTubePage = window.location.hostname.includes('youtube.com');
    sendResponse({ isYouTubePage });
  }
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Function to extract video information from the current page
function extractCurrentVideoInfo() {
  try {
    // For a YouTube watch page
    if (window.location.pathname.includes('/watch')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      const videoTitle = document.querySelector('h1.title')?.textContent?.trim();
      const channelName = document.querySelector('#owner-name a')?.textContent?.trim();
      
      return {
        videoId,
        videoTitle,
        channelName,
        url: window.location.href
      };
    }
    return null;
  } catch (error) {
    console.error('Error extracting video info:', error);
    return null;
  }
}

// Check if we're on the Liked Videos page and inject our button
function checkAndInjectButton() {
  // Match the URL pattern for the Liked Videos page
  if (window.location.pathname.includes('/playlist') && 
      window.location.search.includes('list=LL')) {
    
    console.log('YouTube Enhancer: Detected Liked Videos page');
    
    // Give the YouTube page time to fully render
    setTimeout(() => {
      injectFetchLikedVideosButton();
    }, 2000);
  }
}

// Inject our custom button
function injectFetchLikedVideosButton() {
  // Look for the container with the Play All and Shuffle buttons
  const actionButtonsContainer = document.querySelector('ytd-playlist-header-renderer #top-level-buttons-computed');
  
  if (!actionButtonsContainer || document.querySelector('.youtube-enhancer-fetch-button')) {
    console.log('Button container not found or button already exists');
    return;
  }
  
  // Create our button with YouTube-like styling
  const fetchButton = document.createElement('button');
  fetchButton.className = 'youtube-enhancer-fetch-button';
  fetchButton.textContent = 'Fetch Liked Videos';
  fetchButton.title = 'Fetch your liked videos with YouTube Enhancer';
  
  // Style the button to match YouTube's aesthetic
  fetchButton.style.cssText = `
    background-color: transparent;
    border: none;
    color: #606060;
    font-family: Roboto, Arial, sans-serif;
    font-size: 14px;
    margin-left: 8px;
    padding: 10px 16px;
    border-radius: 2px;
    cursor: pointer;
    text-transform: uppercase;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Add hover effect
  fetchButton.addEventListener('mouseenter', () => {
    fetchButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    fetchButton.style.color = '#0f0f0f';
  });
  
  fetchButton.addEventListener('mouseleave', () => {
    fetchButton.style.backgroundColor = 'transparent';
    fetchButton.style.color = '#606060';
  });
  
  // Add click handler
  fetchButton.addEventListener('click', () => {
    console.log('Fetch Liked Videos button clicked');
    
    // Show a simple loading indicator
    const originalText = fetchButton.textContent;
    fetchButton.textContent = 'Fetching...';
    fetchButton.disabled = true;
    
    // Send message to background script to fetch liked videos
    chrome.runtime.sendMessage({ action: 'getLikedVideos' }, (response) => {
      // Restore the button
      fetchButton.textContent = originalText;
      fetchButton.disabled = false;
      
      if (chrome.runtime.lastError) {
        console.error('Error messaging background script:', chrome.runtime.lastError);
        showNotification('Failed to fetch videos. Try again later.', 'error');
        return;
      }
      
      if (response.error) {
        console.error('Error in response:', response.error);
        
        if (response.error.includes('User is not authenticated')) {
          showNotification('Please sign in using the extension popup first.', 'error');
        } else {
          showNotification('Failed to fetch liked videos: ' + response.error, 'error');
        }
        return;
      }
      
      if (response.videos) {
        const count = response.videos.length;
        console.log(`Found ${count} liked videos:`, response.videos);
        showNotification(`Successfully fetched ${count} liked videos!`, 'success');
      } else {
        showNotification('No liked videos found.', 'success');
      }
    });
  });
  
  // Append the button to the container
  actionButtonsContainer.appendChild(fetchButton);
  console.log('YouTube Enhancer: Fetch button injected successfully');
}

// Helper function to show a notification overlay
function showNotification(message, type = 'success') {
  // Remove any existing notification
  const existingNotification = document.querySelector('.youtube-enhancer-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'youtube-enhancer-notification';
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 4px;
    font-family: Roboto, Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease-in-out;
  `;
  
  // Apply different styles based on notification type
  if (type === 'success') {
    notification.style.backgroundColor = '#2ecc71';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#e74c3c';
    notification.style.color = 'white';
  }
  
  // Add to the DOM
  document.body.appendChild(notification);
  
  // Remove after a delay
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Run the check when the page loads
checkAndInjectButton();

// Also check when navigation happens (for YouTube's single-page application)
// Observe for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('YouTube page changed to:', location.href);
    
    // Check and inject our button if we're on the liked videos page
    checkAndInjectButton();
  }
}).observe(document, {subtree: true, childList: true});
