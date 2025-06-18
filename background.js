// List of blocked domains (can be updated via options page)
let blockedSites = [
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "reddit.com",
  "youtube.com",
  "n12.co.il",
  "ynet.co.il"
];

// Function to create rules for declarativeNetRequest
function createRules(sites) {
  const rules = [];
  let ruleId = 1;
  
  sites.forEach((site) => {
    // Create a rule for the exact domain
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: "block" },
      condition: {
        requestDomains: [site],
        resourceTypes: ["main_frame", "sub_frame"]
      }
    });
    
    // Create a rule for all subdomains
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: "block" },
      condition: {
        requestDomains: ["*." + site],
        resourceTypes: ["main_frame", "sub_frame"]
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

// Load blocked sites from storage and update rules
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

// Optional: Add listener for extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});
