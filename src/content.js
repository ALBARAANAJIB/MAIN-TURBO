
// YouTube Enhancer Content Script

// Constants
const YOUTUBE_LIKED_VIDEOS_PAGE = 'https://www.youtube.com/playlist?list=LL';
const BUTTON_ID = 'yt-enhancer-fetch-btn';

// Track page navigation
let currentUrl = window.location.href;

// Initialize the content script
function init() {
  console.log('YouTube Enhancer content script loaded');
  
  // Check if we're on the YouTube liked videos page
  if (isLikedVideosPage()) {
    // Try multiple times to inject the button (YouTube's UI loads dynamically)
    injectButtonWithRetry(10);
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
  const observer = new MutationObserver(() => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      console.log('Page changed to:', currentUrl);
      
      // Check if we need to inject the fetch button
      if (isLikedVideosPage()) {
        injectButtonWithRetry(10);
      }
    }
  });
  
  // Start observing
  observer.observe(document, { subtree: true, childList: true });
}

// Try to inject the button multiple times with delay
function injectButtonWithRetry(maxAttempts) {
  let attempts = 0;
  
  const tryInject = () => {
    if (document.getElementById(BUTTON_ID)) {
      console.log('Button already exists');
      return; // Button already exists
    }
    
    attempts++;
    console.log(`Attempt ${attempts} to inject button...`);
    
    // Try different selectors for header area
    const injected = injectButton();
    
    if (!injected && attempts < maxAttempts) {
      // Try again after a delay
      setTimeout(tryInject, 1000);
    }
  };
  
  tryInject();
}

// Inject the button into the YouTube page
function injectButton() {
  // First, look for the standard playlist header elements
  const selectors = [
    // Primary selectors
    '#top-row ytd-playlist-header-renderer',
    '#top-level-buttons-computed',
    '#menu-container',
    // Fallbacks
    'ytd-playlist-header-renderer',
    'ytd-playlist-sidebar-primary-info-renderer'
  ];
  
  let container = null;
  
  // Try each selector
  for (const selector of selectors) {
    container = document.querySelector(selector);
    if (container) {
      console.log('Found container with selector:', selector);
      break;
    }
  }
  
  // If we still don't have a container, try to find any element that looks like a header
  if (!container) {
    container = document.querySelector('ytd-playlist-header-renderer') || 
               document.querySelector('.playlist-items') ||
               document.querySelector('ytd-playlist-sidebar-renderer');
  }
  
  // If we found a container, inject the button
  if (container) {
    console.log('Injecting button into container:', container);
    
    // Create button
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'yt-enhancer-btn';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 8px;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      Fetch Liked Videos
    `;
    
    // Style the button to match YouTube's style
    button.style.cssText = `
      background-color: #f00;
      color: white;
      border: none;
      border-radius: 18px;
      padding: 8px 16px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      margin: 8px;
      font-family: 'Roboto', sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: background-color 0.2s, transform 0.1s;
    `;
    
    // Add hover and active effects
    button.onmouseover = () => {
      button.style.backgroundColor = '#cc0000';
      button.style.transform = 'translateY(-1px)';
    };
    
    button.onmouseout = () => {
      button.style.backgroundColor = '#f00';
      button.style.transform = 'translateY(0)';
    };
    
    button.onmousedown = () => {
      button.style.transform = 'scale(0.98)';
    };
    
    button.onmouseup = () => {
      button.style.transform = 'translateY(-1px)';
    };
    
    // Add click handler
    button.addEventListener('click', fetchLikedVideos);
    
    // Create a wrapper to help position the button
    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin: 8px;
    `;
    
    buttonWrapper.appendChild(button);
    
    // Try to insert at different positions
    try {
      // Try prepending first
      container.insertBefore(buttonWrapper, container.firstChild);
      return true;
    } catch (e) {
      // If that fails, try appending
      try {
        container.appendChild(buttonWrapper);
        return true;
      } catch (e2) {
        console.error('Failed to inject button:', e2);
        return false;
      }
    }
  }
  
  console.warn('Could not find a suitable container for the button');
  return false;
}

// Handle fetch button click
function fetchLikedVideos() {
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;
  
  // Update button to loading state
  const originalHTML = button.innerHTML;
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 8px; animation: yt-enhancer-spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 6v6l4 2"></path>
    </svg>
    Fetching...
  `;
  button.disabled = true;
  
  // Add keyframes for spin animation
  if (!document.getElementById('yt-enhancer-keyframes')) {
    const style = document.createElement('style');
    style.id = 'yt-enhancer-keyframes';
    style.textContent = `
      @keyframes yt-enhancer-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
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
      showNotification(`✅ ${count} videos fetched successfully!`, 'success', true);
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
  
  // Create notification container
  const notification = document.createElement('div');
  notification.id = 'yt-enhancer-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 16px 20px;
    background: rgba(33, 33, 33, 0.95);
    color: white;
    border-radius: 10px;
    z-index: 9999;
    font-size: 14px;
    font-family: 'Roboto', sans-serif;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    max-width: 400px;
    animation: yt-enhancer-notification-enter 0.3s ease-out;
    border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
  `;
  
  // Add message
  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  notification.appendChild(messageEl);
  
  // Add dashboard link if requested
  if (showDashboardLink) {
    const link = document.createElement('a');
    link.textContent = 'Open Dashboard →';
    link.style.cssText = `
      color: #8ab4f8;
      margin-left: 8px;
      text-decoration: none;
      font-weight: 500;
      padding: 4px 10px;
      background: rgba(138, 180, 248, 0.1);
      border-radius: 14px;
      transition: background 0.2s;
    `;
    
    link.onmouseover = () => {
      link.style.background = 'rgba(138, 180, 248, 0.2)';
      link.style.textDecoration = 'underline';
    };
    
    link.onmouseout = () => {
      link.style.background = 'rgba(138, 180, 248, 0.1)';
      link.style.textDecoration = 'none';
    };
    
    link.onclick = (e) => {
      e.preventDefault();
      openDashboard();
    };
    
    notification.appendChild(link);
  }
  
  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    margin-left: auto;
    cursor: pointer;
    opacity: 0.7;
    font-size: 20px;
    font-weight: bold;
    padding: 0 4px;
  `;
  
  closeBtn.onmouseover = () => {
    closeBtn.style.opacity = '1';
  };
  
  closeBtn.onmouseout = () => {
    closeBtn.style.opacity = '0.7';
  };
  
  closeBtn.onclick = () => {
    notification.remove();
  };
  
  notification.appendChild(closeBtn);
  
  // Add keyframes for notification animation
  if (!document.getElementById('yt-enhancer-notification-keyframes')) {
    const style = document.createElement('style');
    style.id = 'yt-enhancer-notification-keyframes';
    style.textContent = `
      @keyframes yt-enhancer-notification-enter {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes yt-enhancer-notification-exit {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = 'yt-enhancer-notification-exit 0.5s ease-out forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 500);
    }
  }, 5000);
}

// Open the dashboard
function openDashboard() {
  chrome.runtime.sendMessage({ action: 'openDashboard' });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openDashboard') {
    chrome.runtime.sendMessage({ action: 'openDashboard' });
    sendResponse({ success: true });
  }
  return true;
});

// Initialize the content script
init();
