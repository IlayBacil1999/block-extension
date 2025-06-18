# 🛡️ Website Blocker Extension - Enhanced Analytics Edition

A comprehensive Chrome extension that blocks distracting websites and provides detailed analytics to help you stay focused and productive.

## 🚀 Features

### Core Blocking
- Block specific websites and all their subdomains
- Easy management through modern options page
- Instant updates without restarting browser
- Beautiful blocked page with motivational content

### 📊 Enhanced Analytics Dashboard

#### Core Metrics
- **Total Blocked Attempts**: Track how many times you tried to access blocked sites
- **Time Saved**: Estimated time saved by blocking distractions (configurable average visit duration)
- **Productivity Score**: Dynamic score (0-100) based on your blocking patterns and focus habits
- **Daily Statistics**: Track your daily blocking patterns

#### Time-Based Analytics
- **Activity Heatmap**: Visual representation of when you're most likely to get distracted (24-hour view)
- **Daily/Weekly Trends**: See patterns in your distraction attempts over time
- **Peak Temptation Hours**: Identify when you're most vulnerable to distractions

#### Category-Based Insights
- **Site Categories**: Automatically categorizes blocked sites (social, entertainment, news, messaging, shopping)
- **Category Breakdown**: See which types of content distract you most
- **Visual Progress Bars**: Easy-to-understand category distribution

#### Focus Sessions
- **Start/End Sessions**: Track dedicated focus periods
- **Session Analytics**: Monitor blocked attempts and overrides during focus time
- **Session History**: Review past focus sessions and their effectiveness
- **Real-time Duration**: See how long your current focus session has been running

#### Productivity Insights
- **Smart Suggestions**: AI-like insights about your browsing patterns
- **Peak Distraction Analysis**: Identify your most problematic hours
- **Improvement Tracking**: See if your focus is improving over time
- **Goal Progress**: Track progress toward your productivity goals

### 🎯 Goal Setting & Tracking
- **Daily Block Limits**: Set goals to reduce distraction attempts
- **Focus Time Goals**: Target specific focus session durations
- **No Social Media Hours**: Configure distraction-free time periods
- **Progress Visualization**: See your progress with intuitive progress bars

### 🔧 Advanced Features
- **Override Tracking**: Monitor when you bypass blocks (if enabled)
- **Session Management**: Start and stop focus sessions for concentrated work
- **Data Export**: Access all your productivity data
- **Reset Options**: Clear analytics while preserving settings

## 📱 Usage

### Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension folder
4. Grant necessary permissions when prompted

### Basic Setup
1. Click the extension icon to open the options page
2. Add websites you want to block (one per line, domain only)
3. Save your changes
4. Click "📊 View Analytics Dashboard" to explore your productivity data

### Focus Sessions
1. In the options page, click "🚀 Start Focus Session"
2. Work without distractions - the session tracks your focus quality
3. Click "⏹️ End Session" when finished
4. Review session statistics in the Analytics Dashboard

### Analytics Dashboard Features
- **Real-time Stats**: Live productivity metrics and scores
- **Activity Heatmap**: Color-coded view of your distraction patterns
- **Category Analysis**: Breakdown of what types of sites distract you
- **Goal Progress**: Visual progress toward your productivity targets
- **Focus Sessions**: History and analysis of your focus periods
- **Productivity Insights**: Smart suggestions based on your patterns

## 🛠️ Technical Implementation

### Files Structure
- `manifest.json` - Extension configuration with enhanced permissions
- `background.js` - Service worker handling blocking and analytics tracking
- `analytics.js` - Comprehensive analytics engine with 10+ metrics
- `options.html/js` - Settings page with focus session controls
- `analytics-dashboard.html` - Detailed analytics visualization
- `blocked.html` - Enhanced blocking page with quick stats

### Analytics Data Structure
The extension tracks comprehensive productivity data:

```javascript
{
  // Core metrics
  totalBlocked: 0,
  sitesStats: {},
  timeSaved: 0, // in minutes
  productivityScore: 100, // 0-100 scale
  
  // Time-based analytics
  timeBasedStats: {
    hourly: Array(24),      // 0-23 hours distribution
    daily: {},              // date -> count mapping
    weekly: Array(7)        // 0-6 (Sunday-Saturday)
  },
  
  // Focus and productivity
  focusSessions: [],        // Complete session history
  currentSession: null,     // Active session tracking
  
  // Category analytics
  categoryStats: {
    social: 0,
    entertainment: 0,
    news: 0,
    messaging: 0,
    shopping: 0,
    other: 0
  },
  
  // Goals and preferences
  goals: {
    dailyBlockLimit: null,
    focusTimeGoal: null,
    noSocialMediaHours: []
  },
  
  // Advanced tracking
  overrides: [],            // Override attempt history
  averageVisitDuration: 15  // User-configurable time estimate
}
```

### Enhanced Analytics Features

#### 🔢 Core Analytics
1. **Blocked Attempts**: Count every distraction attempt with timestamp and context
2. **Time Saved Estimation**: Calculate productivity gains using average visit duration
3. **Focus Session Tracking**: Monitor dedicated work periods with quality metrics
4. **Site Access Patterns**: Identify most tempting sites and peak distraction hours

#### 📈 Advanced Analytics
5. **Category-Based Stats**: Automatic classification of blocked content types
6. **Goal Progress Tracking**: Visual progress toward user-defined productivity goals
7. **Productivity Score Algorithm**: Dynamic 0-100 score based on multiple factors
8. **Activity Heatmaps**: Visual patterns of distraction attempts across time
9. **Productivity Insights Engine**: Smart suggestions based on behavior patterns
10. **Override Tracking**: Monitor willpower and blocking effectiveness

### Productivity Score Calculation
```javascript
// Base score starts at 100
let score = 100;

// Penalties for high distraction (last 7 days)
if (recentBlocks > 50) {
  score -= Math.min(30, (recentBlocks - 50) * 0.5);
}

// Penalties for override attempts
score -= Math.min(40, recentOverrides * 5);

// Bonuses for longer focus sessions
if (avgSessionLength > 60) {
  score += Math.min(20, (avgSessionLength - 60) * 0.1);
}

return Math.max(0, Math.min(100, Math.round(score)));
```

### Permissions Required
- `declarativeNetRequest` - Website blocking functionality
- `storage` - Settings and analytics data persistence
- `activeTab` - Current tab information for tracking
- `webNavigation` - Navigation attempt monitoring

## 🎨 Analytics Visualizations

### Activity Heatmap
- 24-hour grid showing distraction intensity
- Color-coded from light (few attempts) to dark (many attempts)
- Hover tooltips with exact counts
- Helps identify peak temptation hours

### Category Breakdown
- Automatic site categorization (social, entertainment, news, etc.)
- Percentage breakdown with visual progress bars
- Identifies your biggest distraction sources
- Enables targeted productivity strategies

### Focus Session Timeline
- Historical view of focus sessions
- Duration, quality, and distraction metrics
- Trend analysis for improvement tracking
- Session comparison and goal progress

### Productivity Insights
- Smart analysis of your patterns
- Personalized suggestions for improvement
- Trend identification (improving/declining focus)
- Peak hours and category recommendations

## 🔍 Troubleshooting

### Extension Not Blocking
- Verify domains are formatted correctly (no http://, no paths)
- Check that extension has required permissions
- Refresh options page and re-save settings

### Analytics Not Updating
- Visit blocked sites to generate tracking data
- Check Chrome storage permissions
- Use refresh button in analytics dashboard
- Verify background script is running

### Performance Optimization
- Analytics data is stored efficiently
- Automatic cleanup of old data
- Minimal memory footprint
- Option to reset analytics if needed

## 🚀 Error Fixes Applied

### Fixed WebRequest Permission Error ✅
**Issue**: `Unchecked runtime.lastError: You do not have permission to use blocking webRequest listeners`

**Solution**: 
- Removed deprecated `webRequest` permission from manifest
- Updated to use only `declarativeNetRequest` for blocking
- Implemented redirect-based tracking instead of blocking listeners
- Added proper message passing between content and background scripts

### Fixed Content Security Policy Violations ✅
**Issue**: `Refused to execute inline script because it violates CSP directive: "script-src 'self'"`

**Solution**:
- Extracted all inline JavaScript to external files
- Created dedicated `.js` files for each HTML page
- Replaced inline event handlers with proper event listeners
- Updated manifest to include new script files in web_accessible_resources
- Full CSP compliance while maintaining all functionality

### Enhanced Manifest V3 Compatibility ✅
- Service worker architecture for background processing
- Declarative net request rules for efficient blocking
- Modern Chrome storage APIs for data persistence
- Optimized for latest Chrome extension standards
- Zero console errors or warnings

## 🤝 Contributing

This extension provides a comprehensive productivity analytics system. Areas for contribution:
- Additional analytics visualizations
- Goal setting enhancements
- Export/import functionality
- Mobile companion app integration

## 📄 Privacy & Security

- **Local Storage Only**: All analytics data stored locally in browser
- **No External Servers**: Zero data transmission to third parties
- **User Control**: Complete control over analytics data
- **Secure Permissions**: Minimal required permissions for functionality
- **Data Portability**: Easy export and reset options

## 🎯 Productivity Benefits

### Immediate Impact
- Instant distraction blocking
- Real-time productivity feedback
- Focus session structure

### Long-term Growth
- Pattern recognition and improvement
- Goal-based productivity enhancement
- Data-driven focus strategies
- Habit formation support

---

**Stay focused, stay productive! 🎯📊**

*Transform your browsing habits with comprehensive analytics and intelligent blocking.*
