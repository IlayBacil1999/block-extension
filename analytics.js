// Enhanced Analytics for Website Blocker Extension

// Site categories for classification
const SITE_CATEGORIES = {
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

// Default enhanced analytics structure
const DEFAULT_ANALYTICS = {
  // Core metrics
  totalBlocked: 0,
  sitesStats: {},
  lastReset: new Date().toISOString(),
  
  // Time-based analytics
  timeBasedStats: {
    hourly: Array(24).fill(0), // 0-23 hours
    daily: {}, // date -> count
    weekly: Array(7).fill(0) // 0-6 (Sunday-Saturday)
  },
  
  // Focus and productivity
  focusSessions: [], // Array of {start, end, blockedAttempts, overrides}
  currentSession: null,
  timeSaved: 0, // in minutes
  
  // Category-based stats
  categoryStats: {
    social: 0,
    entertainment: 0,
    news: 0,
    messaging: 0,
    shopping: 0,
    other: 0
  },
  
  // Goals and tracking
  goals: {
    dailyBlockLimit: null,
    focusTimeGoal: null, // in minutes
    noSocialMediaHours: [] // array of hour ranges
  },
  
  // Override tracking
  overrides: [],
  
  // Productivity score (0-100)
  productivityScore: 100,
  
  // Settings
  averageVisitDuration: 15 // minutes - user configurable
};

// Load analytics from storage
function loadAnalytics() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["analytics"], (result) => {
      if (result.analytics) {
        // Merge with default structure to handle new properties
        const analytics = { ...DEFAULT_ANALYTICS, ...result.analytics };
        
        // Ensure nested objects exist
        analytics.timeBasedStats = { ...DEFAULT_ANALYTICS.timeBasedStats, ...analytics.timeBasedStats };
        analytics.categoryStats = { ...DEFAULT_ANALYTICS.categoryStats, ...analytics.categoryStats };
        analytics.goals = { ...DEFAULT_ANALYTICS.goals, ...analytics.goals };
        
        resolve(analytics);
      } else {
        resolve({ ...DEFAULT_ANALYTICS });
      }
    });
  });
}

// Save analytics to storage
function saveAnalytics(analytics) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ analytics: analytics }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Track a blocked attempt with enhanced analytics
async function trackBlockedAttempt(domain, blockedSite) {
  try {
    const analytics = await loadAnalytics();
    const now = new Date();
    
    // Core tracking
    analytics.totalBlocked++;
    
    // Site-specific stats
    if (!analytics.sitesStats[blockedSite]) {
      analytics.sitesStats[blockedSite] = 0;
    }
    analytics.sitesStats[blockedSite]++;
    
    // Time-based tracking
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday
    const dateStr = now.toDateString();
    
    analytics.timeBasedStats.hourly[hour]++;
    analytics.timeBasedStats.weekly[day]++;
    
    if (!analytics.timeBasedStats.daily[dateStr]) {
      analytics.timeBasedStats.daily[dateStr] = 0;
    }
    analytics.timeBasedStats.daily[dateStr]++;
    
    // Category tracking
    const category = SITE_CATEGORIES[blockedSite] || 'other';
    analytics.categoryStats[category]++;
    
    // Time saved calculation
    analytics.timeSaved += analytics.averageVisitDuration;
    
    // Update current focus session
    if (analytics.currentSession) {
      analytics.currentSession.blockedAttempts++;
    }
    
    // Recalculate productivity score
    analytics.productivityScore = calculateProductivityScore(analytics);
    
    await saveAnalytics(analytics);
    return analytics;
  } catch (error) {
    console.error("Error tracking blocked attempt:", error);
    return null;
  }
}

// Start a focus session
async function startFocusSession() {
  try {
    const analytics = await loadAnalytics();
    
    analytics.currentSession = {
      start: new Date().toISOString(),
      end: null,
      blockedAttempts: 0,
      overrides: 0
    };
    
    await saveAnalytics(analytics);
    return analytics.currentSession;
  } catch (error) {
    console.error("Error starting focus session:", error);
    return null;
  }
}

// End a focus session
async function endFocusSession() {
  try {
    const analytics = await loadAnalytics();
    
    if (analytics.currentSession) {
      analytics.currentSession.end = new Date().toISOString();
      analytics.focusSessions.push({ ...analytics.currentSession });
      analytics.currentSession = null;
      
      await saveAnalytics(analytics);
      return analytics.focusSessions[analytics.focusSessions.length - 1];
    }
    
    return null;
  } catch (error) {
    console.error("Error ending focus session:", error);
    return null;
  }
}

// Track an override/unblock request
async function trackOverride(site, reason = '', duration = 0) {
  try {
    const analytics = await loadAnalytics();
    
    const override = {
      site,
      reason,
      duration, // in minutes, 0 = permanent
      timestamp: new Date().toISOString()
    };
    
    analytics.overrides.push(override);
    
    // Update current session if active
    if (analytics.currentSession) {
      analytics.currentSession.overrides++;
    }
    
    // Recalculate productivity score
    analytics.productivityScore = calculateProductivityScore(analytics);
    
    await saveAnalytics(analytics);
    return analytics;
  } catch (error) {
    console.error("Error tracking override:", error);
    return null;
  }
}

// Calculate productivity score (0-100)
function calculateProductivityScore(analytics) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Recent blocks (last 7 days)
  const recentBlocks = Object.entries(analytics.timeBasedStats.daily)
    .filter(([date]) => new Date(date) >= sevenDaysAgo)
    .reduce((sum, [, count]) => sum + count, 0);
  
  // Recent overrides (last 7 days)
  const recentOverrides = analytics.overrides
    .filter(override => new Date(override.timestamp) >= sevenDaysAgo)
    .length;
  
  // Base score starts at 100
  let score = 100;
  
  // Reduce score for excessive blocks (indicates high temptation)
  if (recentBlocks > 50) {
    score -= Math.min(30, (recentBlocks - 50) * 0.5);
  }
  
  // Reduce score for overrides
  score -= Math.min(40, recentOverrides * 5);
  
  // Bonus for longer focus sessions
  const recentSessions = analytics.focusSessions
    .filter(session => new Date(session.start) >= sevenDaysAgo)
    .map(session => {
      const start = new Date(session.start);
      const end = session.end ? new Date(session.end) : new Date();
      return (end - start) / (1000 * 60); // duration in minutes
    });
  
  const avgSessionLength = recentSessions.length > 0 
    ? recentSessions.reduce((sum, duration) => sum + duration, 0) / recentSessions.length
    : 0;
  
  if (avgSessionLength > 60) {
    score += Math.min(20, (avgSessionLength - 60) * 0.1);
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Get productivity insights
function getProductivityInsights(analytics) {
  const insights = [];
  
  // Peak distraction hours
  const hourlyStats = analytics.timeBasedStats.hourly;
  const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));
  if (hourlyStats[peakHour] > 0) {
    insights.push({
      type: 'peak_hour',
      message: `Your peak distraction time is ${peakHour}:00-${peakHour + 1}:00`,
      hour: peakHour
    });
  }
  
  // Most distracting category
  const topCategory = Object.entries(analytics.categoryStats)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topCategory && topCategory[1] > 0) {
    insights.push({
      type: 'top_category',
      message: `${topCategory[0]} sites are your biggest distraction`,
      category: topCategory[0],
      count: topCategory[1]
    });
  }
  
  // Productivity trend
  const recentDays = Object.entries(analytics.timeBasedStats.daily)
    .slice(-7)
    .map(([, count]) => count);
  
  if (recentDays.length >= 3) {
    const recent = recentDays.slice(-3).reduce((sum, count) => sum + count, 0) / 3;
    const previous = recentDays.slice(0, 3).reduce((sum, count) => sum + count, 0) / 3;
    
    if (recent < previous * 0.8) {
      insights.push({
        type: 'improving',
        message: 'Your focus is improving! Fewer distractions lately.',
      });
    } else if (recent > previous * 1.2) {
      insights.push({
        type: 'declining',
        message: 'You seem more distracted lately. Consider adjusting your blocklist.',
      });
    }
  }
  
  return insights;
}

// Get time-based statistics for heatmap
function getHeatmapData(analytics) {
  return {
    hourly: analytics.timeBasedStats.hourly,
    daily: analytics.timeBasedStats.daily,
    weekly: analytics.timeBasedStats.weekly
  };
}

// Reset all analytics data
async function resetAnalytics() {
  try {
    await saveAnalytics({ ...DEFAULT_ANALYTICS });
    return { ...DEFAULT_ANALYTICS };
  } catch (error) {
    console.error("Error resetting analytics:", error);
    return null;
  }
}

// Get top blocked sites
function getTopBlockedSites(analytics, limit = 5) {
  return Object.entries(analytics.sitesStats || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

// Get goal progress
function getGoalProgress(analytics) {
  const now = new Date();
  const today = now.toDateString();
  const todayBlocks = analytics.timeBasedStats.daily[today] || 0;
  
  const progress = {
    dailyBlocks: {
      current: todayBlocks,
      goal: analytics.goals.dailyBlockLimit,
      progress: analytics.goals.dailyBlockLimit ? 
        Math.max(0, 100 - (todayBlocks / analytics.goals.dailyBlockLimit * 100)) : null
    },
    focusTime: {
      current: analytics.currentSession ? 
        (new Date() - new Date(analytics.currentSession.start)) / (1000 * 60) : 0,
      goal: analytics.goals.focusTimeGoal,
      progress: analytics.goals.focusTimeGoal ?
        Math.min(100, (analytics.currentSession ? 
          (new Date() - new Date(analytics.currentSession.start)) / (1000 * 60) : 0) / analytics.goals.focusTimeGoal * 100) : null
    }
  };
  
  return progress;
}

// Export functions for use in other files
if (typeof module !== 'undefined') {
  module.exports = {
    loadAnalytics,
    saveAnalytics,
    trackBlockedAttempt,
    trackOverride,
    startFocusSession,
    endFocusSession,
    resetAnalytics,
    getTopBlockedSites,
    getProductivityInsights,
    getHeatmapData,
    getGoalProgress,
    calculateProductivityScore
  };
}
