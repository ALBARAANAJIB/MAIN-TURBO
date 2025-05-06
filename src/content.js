
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

// Observe YouTube page for navigation changes
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('YouTube page changed to:', location.href);
    
    // Notify the background script about page change
    chrome.runtime.sendMessage({
      action: 'pageChanged',
      url: location.href,
      videoInfo: extractCurrentVideoInfo()
    });
  }
}).observe(document, {subtree: true, childList: true});

// Initial page load
chrome.runtime.sendMessage({
  action: 'pageLoaded',
  url: location.href,
  videoInfo: extractCurrentVideoInfo()
});
