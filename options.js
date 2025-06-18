// Global variables
let currentBlockedSites = [];
let siteAnalytics = {
  totalBlocked: 0,
  sitesStats: {},
  lastReset: new Date().toISOString()
};

// Focus Session Management
let currentSession = null;
let sessionUpdateInterval = null;

// Load blocked sites from storage
function loadBlockedSites() {
  chrome.storage.sync.get(["blockedSites", "analytics"], (result) => {
    if (result.blockedSites) {
      currentBlockedSites = result.blockedSites;
      document.getElementById("sites").value = result.blockedSites.join("\n");
    } else {
      // Load default sites if none saved
      const defaultSites = [
        "facebook.com",
        "twitter.com", 
        "instagram.com",
        "reddit.com",
        "youtube.com",
        "n12.co.il",
        "ynet.co.il"
      ];
      currentBlockedSites = defaultSites;
      document.getElementById("sites").value = defaultSites.join("\n");
    }
    
    // Load analytics data
    if (result.analytics) {
      siteAnalytics = result.analytics;
    }
    
    updateDisplay();
    updateAnalyticsDisplay();
  });
}

// Update the display of currently blocked sites
function updateDisplay() {
  // Update stats
  document.getElementById("blockedCount").textContent = currentBlockedSites.length;
  document.getElementById("rulesCount").textContent = currentBlockedSites.length * 2; // Each site has 2 rules
  
  // Update current sites list
  const currentSitesList = document.getElementById("currentSites");
  if (currentBlockedSites.length === 0) {
    currentSitesList.innerHTML = '<li style="color: #999; font-style: italic;">No sites blocked yet</li>';
  } else {
    currentSitesList.innerHTML = currentBlockedSites.map(site => 
      `<li class="site-item">
        <span class="domain">${site}</span>
        <span class="status">BLOCKED</span>
      </li>`
    ).join("");
  }
}

// Update the analytics display
function updateAnalyticsDisplay() {
  document.getElementById("totalBlockedCount").textContent = siteAnalytics.totalBlocked || 0;
  
  // Format the last reset date
  const lastReset = new Date(siteAnalytics.lastReset || new Date());
  document.getElementById("lastReset").textContent = lastReset.toLocaleDateString() + " " + lastReset.toLocaleTimeString();
  
  // Update top blocked sites
  const topSitesContainer = document.getElementById("topBlockedSites");
  topSitesContainer.innerHTML = "";
  
  // Convert site stats to array and sort by block count
  const sortedSites = Object.entries(siteAnalytics.sitesStats || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Get top 5
    
  if (sortedSites.length === 0) {
    topSitesContainer.innerHTML = '<li class="no-data">No blocking data yet</li>';
  } else {
    sortedSites.forEach(([site, count]) => {
      const percentage = siteAnalytics.totalBlocked ? 
        Math.round((count / siteAnalytics.totalBlocked) * 100) : 0;
      
      const listItem = document.createElement("li");
      listItem.className = "analytics-item";
      listItem.innerHTML = `
        <div class="site-info">
          <span class="site-name">${site}</span>
          <span class="block-count">${count} blocks</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
          <span class="percentage">${percentage}%</span>
        </div>
      `;
      topSitesContainer.appendChild(listItem);
    });
  }
}

// Function to validate domains
function validateDomains(domains) {
  // Enhanced domain validation regex
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  
  const invalidDomains = domains.filter(domain => {
    // Remove any protocol if accidentally included
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return !domainRegex.test(cleanDomain);
  });
  
  return invalidDomains;
}

// Function to clean domain input
function cleanDomains(domains) {
  return domains.map(domain => {
    // Remove protocol and paths
    return domain.replace(/^https?:\/\//, '')
                 .replace(/\/.*$/, '')
                 .toLowerCase()
                 .trim();
  }).filter(domain => domain.length > 0);
}

// Show status message with styling
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById("status");
  statusEl.innerHTML = message;
  statusEl.className = `status-${type}`;
  
  if (type === 'success') {
    setTimeout(() => { 
      statusEl.textContent = ""; 
      statusEl.className = "";
    }, 3000);
  }
}

// Handle form submission
document.getElementById("blockForm").onsubmit = function(e) {
  e.preventDefault();
  
  const sitesInput = document.getElementById("sites").value;
  const sites = sitesInput.split("\n")
    .map(s => s.trim())
    .filter(Boolean);
  
  // Clean the domains
  const cleanedSites = cleanDomains(sites);
  
  // Validate domains
  const invalidDomains = validateDomains(cleanedSites);
  if (invalidDomains.length > 0) {
    showStatus(`❌ Invalid domains: ${invalidDomains.join(", ")}`, 'error');
    return;
  }
  
  // Remove duplicates
  const uniqueSites = [...new Set(cleanedSites)];
  
  // Show saving status
  showStatus("💾 Saving and updating rules...", 'info');
  
  chrome.storage.sync.set({ blockedSites: uniqueSites }, () => {
    if (chrome.runtime.lastError) {
      showStatus(`❌ Error: ${chrome.runtime.lastError.message}`, 'error');
    } else {
      currentBlockedSites = uniqueSites;
      document.getElementById("sites").value = uniqueSites.join("\n");
      updateDisplay();
      showStatus(`✅ Successfully saved! Now blocking ${uniqueSites.length} sites.`, 'success');
    }
  });
};

// Clear all button functionality
document.getElementById("clearBtn").addEventListener("click", function() {
  if (confirm("Are you sure you want to clear all blocked sites?")) {
    document.getElementById("sites").value = "";
    showStatus("🗑️ Cleared! Click 'Save Changes' to update.", 'info');
  }
});

// Reset analytics button functionality
document.getElementById("resetStatsBtn").addEventListener("click", function() {
  if (confirm("Are you sure you want to reset all analytics data?")) {
    siteAnalytics = {
      totalBlocked: 0,
      sitesStats: {},
      lastReset: new Date().toISOString()
    };
    
    chrome.storage.sync.set({ analytics: siteAnalytics }, function() {
      updateAnalyticsDisplay();
      showStatus("📊 Analytics data has been reset", 'info');
    });
  }
});

// Refresh button functionality
document.getElementById("refreshBtn").addEventListener("click", function() {
  loadBlockedSites();
  showStatus("🔄 Refreshed from storage", 'info');
});

// Load focus session state
async function loadFocusSession() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(["analytics"], resolve);
    });
    
    if (result.analytics && result.analytics.currentSession) {
      currentSession = result.analytics.currentSession;
      updateSessionDisplay();
      startSessionTimer();
    }
  } catch (error) {
    console.error('Error loading focus session:', error);
  }
}

// Start a new focus session
async function startFocusSession() {
  try {
    const analytics = await new Promise((resolve) => {
      chrome.storage.sync.get(["analytics"], (result) => {
        const defaultAnalytics = {
          totalBlocked: 0,
          sitesStats: {},
          lastReset: new Date().toISOString(),
          currentSession: null,
          focusSessions: [],
          // ... other default properties
        };
        resolve(result.analytics ? { ...defaultAnalytics, ...result.analytics } : defaultAnalytics);
      });
    });
    
    analytics.currentSession = {
      start: new Date().toISOString(),
      end: null,
      blockedAttempts: 0,
      overrides: 0
    };
    
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set({ analytics }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    
    currentSession = analytics.currentSession;
    updateSessionDisplay();
    startSessionTimer();
    
    showStatus("🚀 Focus session started!", 'success');
  } catch (error) {
    console.error('Error starting focus session:', error);
    showStatus("❌ Failed to start focus session", 'error');
  }
}

// End the current focus session
async function endFocusSession() {
  try {
    if (!currentSession) return;
    
    const analytics = await new Promise((resolve) => {
      chrome.storage.sync.get(["analytics"], (result) => {
        resolve(result.analytics);
      });
    });
    
    if (analytics && analytics.currentSession) {
      analytics.currentSession.end = new Date().toISOString();
      analytics.focusSessions = analytics.focusSessions || [];
      analytics.focusSessions.push({ ...analytics.currentSession });
      analytics.currentSession = null;
      
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({ analytics }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }
    
    currentSession = null;
    updateSessionDisplay();
    stopSessionTimer();
    
    showStatus("⏹️ Focus session ended!", 'success');
  } catch (error) {
    console.error('Error ending focus session:', error);
    showStatus("❌ Failed to end focus session", 'error');
  }
}

// Update session display
function updateSessionDisplay() {
  const statusEl = document.getElementById('sessionStatus');
  const startBtn = document.getElementById('startSessionBtn');
  const endBtn = document.getElementById('endSessionBtn');
  
  if (currentSession) {
    const start = new Date(currentSession.start);
    const now = new Date();
    const duration = Math.floor((now - start) / (1000 * 60)); // minutes
    
    statusEl.innerHTML = `
      <div style="color: #28a745; font-weight: bold;">Active Session</div>
      <div style="font-size: 0.9em;">Duration: ${duration} minutes</div>
      <div style="font-size: 0.9em;">Blocked attempts: ${currentSession.blockedAttempts}</div>
    `;
    
    startBtn.disabled = true;
    endBtn.disabled = false;
  } else {
    statusEl.textContent = 'No active session';
    startBtn.disabled = false;
    endBtn.disabled = true;
  }
}

// Start session timer
function startSessionTimer() {
  if (sessionUpdateInterval) {
    clearInterval(sessionUpdateInterval);
  }
  
  sessionUpdateInterval = setInterval(updateSessionDisplay, 60000); // Update every minute
}

// Stop session timer
function stopSessionTimer() {
  if (sessionUpdateInterval) {
    clearInterval(sessionUpdateInterval);
    sessionUpdateInterval = null;
  }
}

// Focus session event listeners
document.getElementById('startSessionBtn').addEventListener('click', startFocusSession);
document.getElementById('endSessionBtn').addEventListener('click', endFocusSession);

// Initialize when page loads
window.onload = function() {
  loadBlockedSites();
  loadFocusSession(); // Load focus session state
  
  // Add hover effects for analytics link
  const analyticsLink = document.getElementById('analyticsLink');
  if (analyticsLink) {
    analyticsLink.addEventListener('mouseover', function() {
      this.style.background = 'rgba(255,255,255,0.3)';
    });
    analyticsLink.addEventListener('mouseout', function() {
      this.style.background = 'rgba(255,255,255,0.2)';
    });
  }
  
  // Add real-time validation
  document.getElementById("sites").addEventListener('input', function() {
    const sites = this.value.split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    
    if (sites.length > 0) {
      const cleanedSites = cleanDomains(sites);
      const invalidDomains = validateDomains(cleanedSites);
      
      if (invalidDomains.length > 0) {
        showStatus(`⚠️ Invalid domains detected: ${invalidDomains.join(", ")}`, 'error');
      } else {
        showStatus("✅ All domains look valid", 'success');
      }
    }
  });
};
