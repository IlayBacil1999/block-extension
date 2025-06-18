// List of blocked domains (can be updated via options page)
let blockedSites = [
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "reddit.com",
  "youtube.com",
  "n12.co.il",
  "ynet.co.il",
  "telegram.org",
  "web.whatsapp.com"
];

// Function to create rules for declarativeNetRequest with redirect for tracking
function createRules(sites) {
  const rules = [];
  let ruleId = 1000; // Start from 1000 to avoid conflicts with static rules
  
  sites.forEach((site) => {
    // Create a rule for the exact domain with redirect to blocked page
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { 
        type: "redirect",
        redirect: { 
          url: chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(site)
        }
      },
      condition: {
        requestDomains: [site],
        resourceTypes: ["main_frame"]
      }
    });
    
    // Create a rule for all subdomains with redirect to blocked page
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { 
        type: "redirect",
        redirect: { 
          url: chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(site)
        }
      },
      condition: {
        requestDomains: ["*." + site],
        resourceTypes: ["main_frame"]
      }
    });
  });
    return rules;
}

// Function to update the dynamic rules
async function updateRules(sites) {
  try {
    // First, remove all existing rules
    const ruleIds = await chrome.declarativeNetRequest.getDynamicRules()
      .then(rules => rules.map(rule => rule.id));
    
    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
    }
    
    // Then add the new rules
    const newRules = createRules(sites);
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });
    
    console.log(`Updated rules for ${sites.length} blocked sites`);
  } catch (error) {
    console.error("Error updating rules:", error);
  }
}

// Load blocked sites from storage
function loadBlockedSites() {
  chrome.storage.sync.get(["blockedSites"], (result) => {
    if (result.blockedSites) {
      blockedSites = result.blockedSites;
      updateRules(blockedSites);
    } else {
      // If no saved sites, use the default list
      updateRules(blockedSites);
    }
  });
}

// Initial load
loadBlockedSites();

// Listen for changes to the blocked sites list
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedSites) {
    blockedSites = changes.blockedSites.newValue;
    updateRules(blockedSites);
  }
});

// Listen for messages from blocked.html to track attempts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'blocked_attempt') {
    try {
      // Load analytics directly since we can't import in service worker
      const analytics = await new Promise((resolve) => {
        chrome.storage.sync.get(["analytics"], (result) => {
          if (result.analytics) {
            // Merge with default structure
            const defaultAnalytics = {
              totalBlocked: 0,
              sitesStats: {},
              lastReset: new Date().toISOString(),
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
              },
              timeSaved: 0,
              productivityScore: 100,
              averageVisitDuration: 15
            };
            resolve({ ...defaultAnalytics, ...result.analytics });
          } else {
            resolve({
              totalBlocked: 0,
              sitesStats: {},
              lastReset: new Date().toISOString(),
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
              },
              timeSaved: 0,
              productivityScore: 100,
              averageVisitDuration: 15
            });
          }
        });
      });

      // Track the blocked attempt
      const now = new Date();
      const domain = message.domain;
      const site = message.site;
      
      // Site categories
      const siteCategories = {
        'facebook.com': 'social',
        'twitter.com': 'social',
        'instagram.com': 'social',
        'reddit.com': 'social',
        'youtube.com': 'entertainment',
        'n12.co.il': 'news',
        'ynet.co.il': 'news',
        'telegram.org': 'messaging',
        'web.whatsapp.com': 'messaging'
      };

      // Update analytics
      analytics.totalBlocked++;
      
      // Site-specific stats
      if (!analytics.sitesStats[site]) {
        analytics.sitesStats[site] = 0;
      }
      analytics.sitesStats[site]++;
      
      // Time-based tracking
      const hour = now.getHours();
      const day = now.getDay();
      const dateStr = now.toDateString();
      
      analytics.timeBasedStats.hourly[hour]++;
      analytics.timeBasedStats.weekly[day]++;
      
      if (!analytics.timeBasedStats.daily[dateStr]) {
        analytics.timeBasedStats.daily[dateStr] = 0;
      }
      analytics.timeBasedStats.daily[dateStr]++;
      
      // Category tracking
      const category = siteCategories[site] || 'other';
      analytics.categoryStats[category]++;
      
      // Time saved calculation
      analytics.timeSaved += analytics.averageVisitDuration;

      // Save updated analytics
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({ analytics: analytics }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      sendResponse({ success: true });
    } catch (error) {
      console.error('Error tracking blocked attempt:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep the message channel open for async response
});

// Optional: Add listener for extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});
