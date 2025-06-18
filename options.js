// Global variables
let currentBlockedSites = [];

// Load blocked sites from storage
function loadBlockedSites() {
  chrome.storage.sync.get(["blockedSites"], (result) => {
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
    updateDisplay();
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

// Refresh button functionality
document.getElementById("refreshBtn").addEventListener("click", function() {
  loadBlockedSites();
  showStatus("🔄 Refreshed from storage", 'info');
});

// Initialize when page loads
window.onload = function() {
  loadBlockedSites();
  
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
