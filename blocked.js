// Blocked page JavaScript
let currentDomain = "Unknown Domain";

// Track this blocking attempt
function trackBlockAttempt() {
  const urlParams = new URLSearchParams(window.location.search);
  const blockedSite = urlParams.get('site');
  
  if (blockedSite && chrome && chrome.runtime) {
    const domain = window.location.hostname || blockedSite;
    
    try {
      chrome.runtime.sendMessage({
        type: 'blocked_attempt',
        domain: domain,
        site: blockedSite
      }, (response) => {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          console.log('Runtime error (expected during extension reload):', chrome.runtime.lastError.message);
          return;
        }
        
        if (!response || !response.success) {
          console.warn('Failed to track blocked attempt:', response?.error || 'No response');
        } else {
          console.log('Successfully tracked blocked attempt for:', blockedSite);
        }
      });
    } catch (error) {
      console.warn('Error sending message to background script:', error);
      // Fallback: try to track directly in storage if message fails
      trackBlockAttemptFallback(domain, blockedSite);
    }
  } else {
    console.warn('Chrome runtime not available, using fallback tracking');
    trackBlockAttemptFallback(domain || blockedSite, blockedSite);
  }
}

// Fallback tracking method that writes directly to storage
function trackBlockAttemptFallback(domain, site) {
  if (!chrome || !chrome.storage) {
    console.warn('Chrome storage not available');
    return;
  }
  
  chrome.storage.sync.get(['analytics'], (result) => {
    if (chrome.runtime.lastError) {
      console.warn('Storage error:', chrome.runtime.lastError.message);
      return;
    }
    
    const analytics = result.analytics || {
      totalBlocked: 0,
      sitesStats: {},
      timeBasedStats: {
        hourly: Array(24).fill(0),
        daily: {},
        weekly: Array(7).fill(0)
      },
      categoryStats: {
        social: 0,
        entertainment: 0,
        news: 0,
        messaging: 0,
        shopping: 0,
        other: 0
      }
    };
    
    // Update basic stats
    analytics.totalBlocked++;
    
    if (!analytics.sitesStats[site]) {
      analytics.sitesStats[site] = 0;
    }
    analytics.sitesStats[site]++;
    
    // Save back to storage
    chrome.storage.sync.set({ analytics }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to save analytics:', chrome.runtime.lastError.message);
      } else {
        console.log('Fallback tracking successful for:', site);
      }
    });
  });
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
      if (chrome.runtime.lastError) {
        console.warn('Error loading analytics:', chrome.runtime.lastError.message);
        return;
      }
      
      if (result.analytics) {
        const analytics = result.analytics;
        
        // Update total blocks
        const totalElement = document.getElementById('totalBlocked');
        if (totalElement) {
          totalElement.textContent = analytics.totalBlocked || 0;
        }
        
        // Find current domain in stats
        const siteDomain = Object.keys(analytics.sitesStats || {}).find(site => 
          currentDomain === site || currentDomain.endsWith(`.${site}`)
        );
        
        const siteCount = siteDomain ? analytics.sitesStats[siteDomain] : 0;
        const siteElement = document.getElementById('siteBlocks');
        if (siteElement) {
          siteElement.textContent = siteCount;
        }
        
        // Calculate percentage
        const percentage = analytics.totalBlocked > 0 ? 
          Math.round((siteCount / analytics.totalBlocked) * 100) : 0;
        const percentElement = document.getElementById('blockPercent');
        if (percentElement) {
          percentElement.textContent = percentage + '%';
        }
        
        // Display top sites
        const topSites = Object.entries(analytics.sitesStats || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5); // Top 5 sites
          
        const topSitesList = document.getElementById('topSitesList');
        if (topSitesList) {
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
      } else {
        console.log('No analytics data found yet');
      }
    });
  } else {
    console.warn('Chrome storage API not available');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize domain display first
  initializeDomain();
  
  // Add a small delay before tracking to ensure background script is ready
  setTimeout(() => {
    trackBlockAttempt();
  }, 100);
  
  // Load analytics after a brief delay
  setTimeout(() => {
    loadAnalytics();
  }, 200);
  
  // Add event listeners
  document.getElementById('optionsBtn').addEventListener('click', openOptions);
  document.getElementById('backBtn').addEventListener('click', goBack);
  document.getElementById('toggleAnalytics').addEventListener('click', toggleAnalytics);
});
