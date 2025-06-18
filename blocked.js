// Blocked page JavaScript
let currentDomain = "Unknown Domain";

// Track this blocking attempt
function trackBlockAttempt() {
  const urlParams = new URLSearchParams(window.location.search);
  const blockedSite = urlParams.get('site');
  
  if (blockedSite && chrome && chrome.runtime) {
    const domain = window.location.hostname || blockedSite;
    
    chrome.runtime.sendMessage({
      type: 'blocked_attempt',
      domain: domain,
      site: blockedSite
    }, (response) => {
      if (!response || !response.success) {
        console.error('Failed to track blocked attempt:', response?.error);
      }
    });
  }
}

// Initialize domain display
function initializeDomain() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const blockedSite = urlParams.get('site');
    currentDomain = blockedSite || window.location.hostname || 'Unknown Domain';
    document.getElementById('blockedDomain').textContent = currentDomain;
  } catch (e) {
    // Fallback if we can't get the domain
    document.getElementById('blockedDomain').textContent = 'Blocked Website';
  }
}

// Options button functionality
function openOptions() {
  if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    // Fallback for when chrome APIs aren't available
    alert('Please open the extension options from the browser toolbar.');
  }
}

// Back button functionality
function goBack() {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = 'about:blank';
  }
}

// Toggle analytics panel
function toggleAnalytics() {
  const content = document.getElementById('analyticsContent');
  const toggleBtn = document.getElementById('toggleAnalytics');
  
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    toggleBtn.textContent = 'Show Stats';
  } else {
    content.classList.add('open');
    toggleBtn.textContent = 'Hide Stats';
  }
}

// Load and display analytics
function loadAnalytics() {
  if (chrome && chrome.storage) {
    chrome.storage.sync.get(['analytics'], function(result) {
      if (result.analytics) {
        const analytics = result.analytics;
        
        // Update total blocks
        document.getElementById('totalBlocked').textContent = analytics.totalBlocked || 0;
        
        // Find current domain in stats
        const siteDomain = Object.keys(analytics.sitesStats || {}).find(site => 
          currentDomain === site || currentDomain.endsWith(`.${site}`)
        );
        
        const siteCount = siteDomain ? analytics.sitesStats[siteDomain] : 0;
        document.getElementById('siteBlocks').textContent = siteCount;
        
        // Calculate percentage
        const percentage = analytics.totalBlocked > 0 ? 
          Math.round((siteCount / analytics.totalBlocked) * 100) : 0;
        document.getElementById('blockPercent').textContent = percentage + '%';
        
        // Display top sites
        const topSites = Object.entries(analytics.sitesStats || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5); // Top 5 sites
          
        const topSitesList = document.getElementById('topSitesList');
        
        if (topSites.length === 0) {
          topSitesList.innerHTML = '<li class="empty-message">No blocking data yet</li>';
        } else {
          topSitesList.innerHTML = '';
          topSites.forEach(([site, count]) => {
            const li = document.createElement('li');
            li.className = 'site-item';
            li.innerHTML = `
              <span class="site-name">${site}</span>
              <span class="site-count">${count}</span>
            `;
            topSitesList.appendChild(li);
          });
        }
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Track immediately when page loads
  trackBlockAttempt();
  
  // Initialize domain display
  initializeDomain();
  
  // Load analytics
  loadAnalytics();
  
  // Add event listeners
  document.getElementById('optionsBtn').addEventListener('click', openOptions);
  document.getElementById('backBtn').addEventListener('click', goBack);
  document.getElementById('toggleAnalytics').addEventListener('click', toggleAnalytics);
});
