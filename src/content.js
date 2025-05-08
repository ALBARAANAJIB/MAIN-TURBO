
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
        setTimeout(injectFetchButton, 800); // Give YouTube some time to render
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
  
  // Look for the line where we want to inject (between header and playlist items)
  const targetContainer = findButtonContainer();
  if (!targetContainer) {
    console.warn('Could not find target container for fetch button');
    // Try again after a short delay
    setTimeout(injectFetchButton, 1000);
    return;
  }
  
  // Create the button with icon
  const fetchButton = document.createElement('button');
  fetchButton.id = 'yt-enhancer-fetch-btn';
  fetchButton.className = 'yt-enhancer-btn';
  fetchButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="yt-enhancer-icon">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    Fetch Liked Videos
  `;
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
  // The red line in the image is right below the playlist header and right above the videos list
  // Look for the container that has the Shuffle/Play All buttons
  const header = document.querySelector('ytd-playlist-header-renderer');
  if (header) {
    // Try to find the line where we want to inject (between header and playlist items)
    const actionsRow = header.querySelector('#top-row');
    if (actionsRow) {
      return actionsRow;
    }
    
    // Alternative: find the stats section which is right above the videos
    const statsSection = header.querySelector('#stats');
    if (statsSection) {
      return statsSection.parentElement;
    }
  }
  
  // Fallback: try to find another suitable container
  return document.querySelector('ytd-playlist-sidebar-renderer');
}

// Handle the fetch button click
function handleFetchButtonClick() {
  const button = document.getElementById('yt-enhancer-fetch-btn');
  if (!button) return;
  
  // Update button to loading state
  const originalHTML = button.innerHTML;
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="yt-enhancer-icon animate-spin">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
    Fetching...
  `;
  button.disabled = true;
  
  // Request the background script to fetch liked videos
  chrome.runtime.sendMessage({ action: 'getLikedVideos' }, (response) => {
    // Restore the button
    button.innerHTML = originalHTML;
    button.disabled = false;
    
    if (chrome.runtime.lastError) {
      showNotification('Error fetching videos. Please try again.', 'error');
      console.error('Error fetching liked videos:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.error) {
      showNotification(response.error, 'error');
      return;
    }
    
    if (response && response.videos) {
      const count = response.videos.length;
      showNotification(`✅ ${count} videos fetched. View and manage them in your dashboard.`, 'success', true);
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
  // The styles are now loaded from the content.css file
  // This function remains for backward compatibility
  console.log('Styles loaded from content.css');
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
