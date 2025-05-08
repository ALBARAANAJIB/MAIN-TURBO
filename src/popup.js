
// DOM elements
const loginView = document.getElementById('login-view');
const userView = document.getElementById('user-view');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const likedVideosBtn = document.getElementById('liked-videos-btn');
const exportDataBtn = document.getElementById('export-data-btn');
const aiSummaryBtn = document.getElementById('ai-summary-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const userAvatar = document.getElementById('user-avatar');
const userEmail = document.getElementById('user-email');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// State management
let isAuthenticated = false;
let currentEmail = 'AxelNash4@gmail.com';

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  likedVideosBtn.addEventListener('click', handleLikedVideos);
  exportDataBtn.addEventListener('click', handleExportData);
  aiSummaryBtn.addEventListener('click', handleAISummary);
  dashboardBtn.addEventListener('click', handleOpenDashboard);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    console.log('Popup received message:', message);
    
    if (message.action === 'authStatus') {
      updateAuthUI(message.isAuthenticated, message.email);
      
      if (message.reason === 'token_expired') {
        showToast('Session expired. Please log in again.', 'error');
      }
    }
  });
}

// Check authentication status with background script
function checkAuthStatus() {
  console.log('Checking auth status...');
  
  chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error checking auth status:', chrome.runtime.lastError);
      updateAuthUI(false);
      return;
    }
    
    console.log('Auth status response:', response);
    updateAuthUI(response.isAuthenticated, response.email);
  });
}

// Handle login button click
function handleLogin() {
  console.log('Login button clicked');
  
  // Add loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = 'Signing in... <span class="loading"></span>';
  
  chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
    // Remove loading state
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in with YouTube';
    
    if (chrome.runtime.lastError) {
      console.error('Authentication error:', chrome.runtime.lastError);
      showToast('Authentication failed. Please try again.', 'error');
      return;
    }
    
    if (response && response.success) {
      showToast('Successfully signed in!', 'success');
      checkAuthStatus(); // This will update the UI
    } else {
      showToast('Authentication failed. Please try again.', 'error');
    }
  });
}

// Handle logout button click
function handleLogout() {
  console.log('Logout button clicked');
  
  // Add loading state
  logoutBtn.disabled = true;
  logoutBtn.textContent = 'Signing out...';
  
  chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
    // Remove loading state
    logoutBtn.disabled = false;
    logoutBtn.textContent = 'Sign out';
    
    if (chrome.runtime.lastError) {
      console.error('Logout error:', chrome.runtime.lastError);
      showToast('Failed to sign out. Please try again.', 'error');
      return;
    }
    
    if (response && response.success) {
      updateAuthUI(false);
      showToast('Successfully signed out!', 'success');
    } else {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  });
}

// Handle liked videos button click
function handleLikedVideos() {
  console.log('Liked videos button clicked');
  
  // Add loading state
  likedVideosBtn.disabled = true;
  const originalText = likedVideosBtn.textContent;
  likedVideosBtn.innerHTML = 'Fetching... <span class="loading"></span>';
  
  chrome.runtime.sendMessage({ action: 'getLikedVideos' }, (response) => {
    // Restore button
    likedVideosBtn.disabled = false;
    likedVideosBtn.textContent = originalText;
    
    if (chrome.runtime.lastError) {
      console.error('Error fetching liked videos:', chrome.runtime.lastError);
      showToast('Failed to fetch liked videos. Please try again.', 'error');
      return;
    }
    
    if (response.error) {
      console.error('Error in response:', response.error);
      
      if (response.error.includes('User is not authenticated')) {
        checkAuthStatus(); // Re-check auth status
        showToast('Please sign in to access this feature.', 'error');
      } else {
        showToast('Failed to fetch liked videos: ' + response.error, 'error');
      }
      return;
    }
    
    if (response.videos) {
      const count = response.videos.length;
      console.log(`Found ${count} liked videos:`, response.videos);
      showToast(`Successfully fetched ${count} liked videos! View them in the dashboard.`, 'success');
    } else {
      showToast('No liked videos found.', 'success');
    }
  });
}

// Handle export data button click
function handleExportData() {
  console.log('Export data button clicked');
  
  chrome.runtime.sendMessage({ action: 'getStoredVideos' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting stored videos:', chrome.runtime.lastError);
      showToast('Failed to export data. Please try again.', 'error');
      return;
    }
    
    if (response && response.videos && response.videos.items && response.videos.items.length > 0) {
      // Create export data
      const exportData = {
        videos: response.videos.items,
        exportDate: new Date().toISOString(),
        totalCount: response.videos.items.length
      };
      
      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Create download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube_liked_videos.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      showToast(`Exported ${exportData.totalCount} videos successfully.`, 'success');
    } else {
      showToast('No videos to export. Fetch your liked videos first.', 'error');
    }
  });
}

// Handle AI summary button click
function handleAISummary() {
  console.log('AI summary button clicked');
  showToast('AI summary feature coming soon!', 'success');
}

// Handle opening the dashboard
function handleOpenDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
}

// Update UI based on authentication status
function updateAuthUI(authenticated, email = null) {
  isAuthenticated = authenticated;
  currentEmail = email || 'AxelNash4@gmail.com';
  
  if (authenticated) {
    loginView.classList.add('hidden');
    userView.classList.remove('hidden');
    
    // Update user info
    userEmail.textContent = currentEmail;
    userAvatar.textContent = currentEmail.charAt(0).toUpperCase();
  } else {
    loginView.classList.remove('hidden');
    userView.classList.add('hidden');
  }
}

// Show toast message
function showToast(message, type = 'default') {
  toastMessage.textContent = message;
  toast.className = 'toast show';
  
  if (type === 'success') {
    toast.classList.add('toast-success');
  } else if (type === 'error') {
    toast.classList.add('toast-error');
  }
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}
