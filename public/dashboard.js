
// YouTube Enhancer Dashboard JavaScript

// DOM Elements
const loadingEl = document.getElementById('loading');
const noVideosEl = document.getElementById('no-videos');
const videosGridEl = document.getElementById('videos-grid');
const videosTableEl = document.getElementById('videos-table');
const tableBodyEl = document.getElementById('table-body');
const userEmailEl = document.getElementById('user-email');
const searchInputEl = document.getElementById('search-input');
const refreshBtnEl = document.getElementById('refresh-btn');
const deleteBtnEl = document.getElementById('delete-btn');
const viewModeBtnEl = document.getElementById('view-mode-btn');
const gridIconEl = document.getElementById('grid-icon');
const listIconEl = document.getElementById('list-icon');
const selectAllEl = document.getElementById('select-all');
const loadMoreContainerEl = document.getElementById('load-more');
const loadMoreBtnEl = document.getElementById('load-more-btn');
const goToYouTubeBtnEl = document.getElementById('go-to-youtube');

// State
let videos = [];
let filteredVideos = [];
let viewMode = 'grid';
let nextPageToken = null;
let totalVideos = 0;

// Initialize dashboard
async function init() {
  console.log('Initializing dashboard');
  
  // Check auth status
  try {
    const auth = await sendExtensionMessage({ action: 'checkAuth' });
    if (auth && auth.email) {
      userEmailEl.textContent = auth.email;
    } else {
      userEmailEl.textContent = 'Not logged in';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    userEmailEl.textContent = 'Auth error';
  }
  
  // Load videos
  await loadVideos();
  
  // Set up event listeners
  setupEventListeners();
}

// Load videos from storage
async function loadVideos() {
  showLoading(true);
  
  try {
    const result = await sendExtensionMessage({ action: 'getStoredVideos' });
    console.log('Loaded videos:', result);
    
    if (result && result.videos && result.videos.items) {
      videos = result.videos.items.map(video => ({
        ...video,
        selected: false
      }));
      
      nextPageToken = result.nextPageToken;
      totalVideos = result.totalResults || 0;
      
      updateVideoDisplay();
      
      if (videos.length === 0) {
        showNoVideos(true);
      } else {
        showNoVideos(false);
      }
    } else {
      videos = [];
      showNoVideos(true);
    }
  } catch (error) {
    console.error('Failed to load videos:', error);
    showError('Failed to load videos');
  } finally {
    showLoading(false);
  }
}

// Load more videos (next page)
async function loadMoreVideos() {
  if (!nextPageToken) return;
  
  const loadingText = loadMoreBtnEl.textContent;
  loadMoreBtnEl.textContent = 'Loading...';
  loadMoreBtnEl.disabled = true;
  
  try {
    const result = await sendExtensionMessage({ 
      action: 'getMoreLikedVideos',
      pageToken: nextPageToken
    });
    
    if (result && result.videos) {
      const newVideos = result.videos.map(video => ({
        ...video,
        selected: false
      }));
      
      videos = [...videos, ...newVideos];
      nextPageToken = result.nextPageToken;
      
      updateVideoDisplay();
    }
  } catch (error) {
    console.error('Failed to load more videos:', error);
    showError('Failed to load more videos');
  } finally {
    loadMoreBtnEl.textContent = loadingText;
    loadMoreBtnEl.disabled = false;
  }
}

// Update video display based on current state
function updateVideoDisplay() {
  // Apply filtering
  const searchTerm = searchInputEl.value.toLowerCase().trim();
  filteredVideos = searchTerm ? 
    videos.filter(video => 
      video.snippet.title.toLowerCase().includes(searchTerm) ||
      video.snippet.channelTitle.toLowerCase().includes(searchTerm)
    ) : 
    videos;
  
  // Update UI based on view mode
  if (viewMode === 'grid') {
    renderGridView();
    videosGridEl.style.display = 'grid';
    videosTableEl.style.display = 'none';
  } else {
    renderTableView();
    videosGridEl.style.display = 'none';
    videosTableEl.style.display = 'block';
  }
  
  // Update load more button
  if (nextPageToken) {
    loadMoreContainerEl.style.display = 'flex';
  } else {
    loadMoreContainerEl.style.display = 'none';
  }
  
  // Update "select all" checkbox
  updateSelectAllCheckbox();
}

// Render grid view
function renderGridView() {
  videosGridEl.innerHTML = '';
  
  filteredVideos.forEach(video => {
    const card = createVideoCard(video);
    videosGridEl.appendChild(card);
  });
}

// Create a video card element
function createVideoCard(video) {
  const { id, snippet, contentDetails, selected } = video;
  const { title, channelTitle, publishedAt, thumbnails } = snippet;
  
  // Get the best thumbnail available
  const thumbnailUrl = thumbnails?.medium?.url || 
                      thumbnails?.default?.url || 
                      'https://via.placeholder.com/480x360?text=No+Thumbnail';
  
  // Format the duration
  const duration = contentDetails?.duration ? formatDuration(contentDetails.duration) : '';
  
  // Create the card element
  const card = document.createElement('div');
  card.className = 'video-card';
  card.dataset.id = id;
  
  card.innerHTML = `
    <div class="video-thumbnail">
      <img src="${thumbnailUrl}" alt="${title}" loading="lazy">
      ${duration ? `<div class="video-duration">${duration}</div>` : ''}
      <input type="checkbox" class="video-checkbox" ${selected ? 'checked' : ''}>
      <div class="play-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="10 8 16 12 10 16 10 8"></polygon>
        </svg>
      </div>
    </div>
    <div class="video-info">
      <div class="video-title">${title}</div>
      <div class="video-meta">
        <div class="video-channel">${channelTitle}</div>
        <div class="video-date">${formatRelativeTime(publishedAt)}</div>
      </div>
    </div>
  `;
  
  // Add event listeners
  const checkbox = card.querySelector('.video-checkbox');
  checkbox.addEventListener('change', e => {
    e.stopPropagation();
    toggleVideoSelection(id);
  });
  
  card.addEventListener('click', e => {
    if (!e.target.classList.contains('video-checkbox')) {
      playVideo(id);
    }
  });
  
  return card;
}

// Render table view
function renderTableView() {
  tableBodyEl.innerHTML = '';
  
  filteredVideos.forEach(video => {
    const row = createTableRow(video);
    tableBodyEl.appendChild(row);
  });
}

// Create a table row element
function createTableRow(video) {
  const { id, snippet, contentDetails, selected } = video;
  const { title, channelTitle, publishedAt, thumbnails } = snippet;
  
  // Get thumbnail URL
  const thumbnailUrl = thumbnails?.default?.url || 'https://via.placeholder.com/120x68?text=No+Thumbnail';
  
  // Create the row element
  const row = document.createElement('tr');
  row.dataset.id = id;
  
  row.innerHTML = `
    <td><input type="checkbox" class="video-checkbox" ${selected ? 'checked' : ''}></td>
    <td>
      <div class="table-thumbnail">
        <img src="${thumbnailUrl}" alt="${title}" loading="lazy">
      </div>
    </td>
    <td>${title}</td>
    <td>${channelTitle}</td>
    <td>${formatDate(publishedAt)}</td>
    <td>
      <button class="btn btn-outline play-btn">Play</button>
    </td>
  `;
  
  // Add event listeners
  const checkbox = row.querySelector('.video-checkbox');
  checkbox.addEventListener('change', () => {
    toggleVideoSelection(id);
  });
  
  const playBtn = row.querySelector('.play-btn');
  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    playVideo(id);
  });
  
  return row;
}

// Toggle video selection
function toggleVideoSelection(id) {
  videos = videos.map(video => 
    video.id === id ? { ...video, selected: !video.selected } : video
  );
  
  updateVideoDisplay();
  updateDeleteButton();
}

// Update select all checkbox
function updateSelectAllCheckbox() {
  if (filteredVideos.length === 0) {
    selectAllEl.checked = false;
    selectAllEl.disabled = true;
    return;
  }
  
  const allSelected = filteredVideos.every(video => video.selected);
  const someSelected = filteredVideos.some(video => video.selected);
  
  selectAllEl.checked = allSelected;
  selectAllEl.indeterminate = someSelected && !allSelected;
  selectAllEl.disabled = false;
}

// Toggle select all videos
function toggleSelectAll() {
  const allSelected = filteredVideos.every(video => video.selected);
  
  videos = videos.map(video => {
    // Only toggle the filtered videos
    const isInFilteredList = filteredVideos.some(v => v.id === video.id);
    return isInFilteredList ? { ...video, selected: !allSelected } : video;
  });
  
  updateVideoDisplay();
  updateDeleteButton();
}

// Update delete button state
function updateDeleteButton() {
  const selectedCount = videos.filter(video => video.selected).length;
  
  if (selectedCount > 0) {
    deleteBtnEl.textContent = `Delete Selected (${selectedCount})`;
    deleteBtnEl.disabled = false;
  } else {
    deleteBtnEl.textContent = 'Delete Selected';
    deleteBtnEl.disabled = true;
  }
}

// Delete selected videos
async function deleteSelectedVideos() {
  const selectedIds = videos.filter(video => video.selected).map(video => video.id);
  
  if (selectedIds.length === 0) return;
  
  if (!confirm(`Are you sure you want to delete ${selectedIds.length} videos?`)) {
    return;
  }
  
  showLoading(true);
  
  try {
    await sendExtensionMessage({
      action: 'deleteVideos',
      videoIds: selectedIds
    });
    
    // Remove deleted videos from local state
    videos = videos.filter(video => !selectedIds.includes(video.id));
    
    updateVideoDisplay();
    
    if (videos.length === 0) {
      showNoVideos(true);
    }
  } catch (error) {
    console.error('Failed to delete videos:', error);
    showError('Failed to delete videos');
  } finally {
    showLoading(false);
  }
}

// Toggle view mode
function toggleViewMode() {
  viewMode = viewMode === 'grid' ? 'table' : 'grid';
  
  if (viewMode === 'grid') {
    viewModeBtnEl.textContent = 'Grid View';
    gridIconEl.style.display = 'inline';
    listIconEl.style.display = 'none';
  } else {
    viewModeBtnEl.textContent = 'List View';
    gridIconEl.style.display = 'none';
    listIconEl.style.display = 'inline';
  }
  
  updateVideoDisplay();
}

// Play video
function playVideo(id) {
  window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
}

// Refresh videos
async function refreshVideos() {
  await loadVideos();
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInputEl.addEventListener('input', updateVideoDisplay);
  
  // Refresh button
  refreshBtnEl.addEventListener('click', refreshVideos);
  
  // Delete button
  deleteBtnEl.addEventListener('click', deleteSelectedVideos);
  
  // View mode toggle
  viewModeBtnEl.addEventListener('click', toggleViewMode);
  
  // Select all checkbox
  selectAllEl.addEventListener('change', toggleSelectAll);
  
  // Load more button
  loadMoreBtnEl.addEventListener('click', loadMoreVideos);
  
  // Go to YouTube button
  goToYouTubeBtnEl.addEventListener('click', () => {
    window.open('https://www.youtube.com/playlist?list=LL', '_blank');
  });
}

// Helper functions
function showLoading(show) {
  loadingEl.style.display = show ? 'flex' : 'none';
}

function showNoVideos(show) {
  noVideosEl.style.display = show ? 'flex' : 'none';
}

function showError(message) {
  alert(message);
}

// Format duration from ISO 8601 format
function formatDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Format date
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString();
}

// Format relative time
function formatRelativeTime(isoDate) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return 'just now';
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

// Send message to extension
function sendExtensionMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response);
    });
  });
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
