
// Constants
const YOUTUBE_LIKED_VIDEOS_PAGE = 'https://www.youtube.com/playlist?list=LL';

// Track page navigation
let currentUrl = window.location.href;

// Initialize the content script
function init() {
  console.log('YouTube Enhancer content script loaded');
  
  // Notify the background script that the page has loaded
  chrome.runtime.sendMessage({ 
    action: 'pageLoaded',
    url: window.location.href
  });
  
  // Check if we're on the YouTube liked videos page
  if (isLikedVideosPage()) {
    injectFetchButton();
  }
  
  // Set up an observer to detect page changes
  setupNavigationObserver();
}

// Check if the current page is the liked videos page
function isLikedVideosPage() {
  return window.location.href.includes('/playlist?list=LL');
}

// Set up an observer to detect YouTube SPA navigation
function setupNavigationObserver() {
  // Create a new observer for the URL changes
  const observer = new MutationObserver(() => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      
      // Notify the background script that the page has changed
      chrome.runtime.sendMessage({ 
        action: 'pageChanged',
        url: currentUrl
      });
      
      // Check if we need to inject the fetch button
      if (isLikedVideosPage()) {
        setTimeout(injectFetchButton, 1000); // Give YouTube some time to render
      }
    }
  });
  
  // Start observing
  observer.observe(document, { subtree: true, childList: true });
}

// Inject the fetch button into the YouTube liked videos page
function injectFetchButton() {
  // Check if the button already exists
  if (document.getElementById('yt-enhancer-fetch-btn')) {
    return;
  }
  
  // Try to find the container for the button
  const targetContainer = findButtonContainer();
  if (!targetContainer) {
    console.warn('Could not find target container for fetch button');
    return;
  }
  
  // Create the button
  const fetchButton = document.createElement('button');
  fetchButton.id = 'yt-enhancer-fetch-btn';
  fetchButton.textContent = 'Fetch My Liked Videos';
  fetchButton.className = 'yt-enhancer-btn';
  fetchButton.addEventListener('click', handleFetchButtonClick);
  
  // Create a wrapper div to match YouTube's layout
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'yt-enhancer-btn-wrapper';
  buttonWrapper.appendChild(fetchButton);
  
  // Add the button to the page
  targetContainer.appendChild(buttonWrapper);
  
  // Add custom styles
  injectStyles();
}

// Find the appropriate container for the fetch button
function findButtonContainer() {
  // This is a simplistic approach; you might need to adjust based on YouTube's structure
  // Try to find the container that has the Shuffle/Play All buttons
  const possibleContainers = document.querySelectorAll('ytd-playlist-header-renderer div#container');
  if (possibleContainers.length > 0) {
    return possibleContainers[0];
  }
  
  // Fallback: try to find another suitable container
  return document.querySelector('ytd-playlist-sidebar-renderer');
}

// Handle the fetch button click
function handleFetchButtonClick() {
  const button = document.getElementById('yt-enhancer-fetch-btn');
  if (!button) return;
  
  // Update button to loading state
  const originalText = button.textContent;
  button.textContent = 'Fetching...';
  button.disabled = true;
  
  // Request the background script to fetch liked videos
  chrome.runtime.sendMessage({ action: 'getLikedVideos' }, (response) => {
    // Restore the button
    button.textContent = originalText;
    button.disabled = false;
    
    if (chrome.runtime.lastError) {
      showNotification('Error fetching videos. Please try again.', 'error');
      console.error('Error fetching liked videos:', chrome.runtime.lastError);
      return;
    }
    
    if (response.error) {
      showNotification(response.error, 'error');
      return;
    }
    
    if (response.videos) {
      const count = response.videos.length;
      showNotification(`✅ ${count} videos fetched. View them in your dashboard.`, 'success', true);
    } else {
      showNotification('No videos found.', 'info');
    }
  });
}

// Show a notification
function showNotification(message, type = 'info', showDashboardLink = false) {
  // Remove any existing notification
  const existingNotification = document.getElementById('yt-enhancer-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create the notification
  const notification = document.createElement('div');
  notification.id = 'yt-enhancer-notification';
  notification.className = `yt-enhancer-notification ${type}`;
  
  // Create the message
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  notification.appendChild(messageElement);
  
  // Add dashboard link if requested
  if (showDashboardLink) {
    const link = document.createElement('a');
    link.textContent = '→ Open Dashboard';
    link.href = '#';
    link.className = 'yt-enhancer-dashboard-link';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });
    notification.appendChild(link);
  }
  
  // Add close button
  const closeButton = document.createElement('span');
  closeButton.className = 'yt-enhancer-notification-close';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    notification.remove();
  });
  notification.appendChild(closeButton);
  
  // Add the notification to the page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.add('yt-enhancer-notification-hiding');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 500);
    }
  }, 5000);
}

// Inject custom styles
function injectStyles() {
  // Check if styles are already injected
  if (document.getElementById('yt-enhancer-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'yt-enhancer-styles';
  styleElement.textContent = `
    .yt-enhancer-btn-wrapper {
      margin-top: 10px;
    }
    
    .yt-enhancer-btn {
      background: rgba(255, 0, 0, 0.1);
      color: #ff0000;
      border: 1px solid rgba(255, 0, 0, 0.2);
      border-radius: 2px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .yt-enhancer-btn:hover {
      background: rgba(255, 0, 0, 0.2);
    }
    
    .yt-enhancer-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .yt-enhancer-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
      background: rgba(33, 33, 33, 0.9);
      color: white;
      border-radius: 4px;
      z-index: 9999;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      animation: yt-enhancer-notification-enter 0.3s ease-out;
    }
    
    .yt-enhancer-notification.success {
      border-left: 4px solid #4caf50;
    }
    
    .yt-enhancer-notification.error {
      border-left: 4px solid #f44336;
    }
    
    .yt-enhancer-notification.info {
      border-left: 4px solid #2196f3;
    }
    
    .yt-enhancer-notification-close {
      margin-left: auto;
      cursor: pointer;
      opacity: 0.7;
      font-size: 18px;
      font-weight: bold;
    }
    
    .yt-enhancer-notification-close:hover {
      opacity: 1;
    }
    
    .yt-enhancer-dashboard-link {
      color: #8ab4f8;
      margin-left: 8px;
      text-decoration: none;
    }
    
    .yt-enhancer-dashboard-link:hover {
      text-decoration: underline;
    }
    
    .yt-enhancer-notification-hiding {
      opacity: 0;
      transition: opacity 0.5s;
    }
    
    @keyframes yt-enhancer-notification-enter {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'openDashboard') {
    chrome.runtime.sendMessage({ action: 'openDashboard' });
    sendResponse({ success: true });
  }
  
  return true;
});

// Initialize the content script
init();
