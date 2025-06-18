// Analytics Dashboard JavaScript
let currentAnalytics = null;

// Load all analytics data
async function loadAllAnalytics() {
  try {
    currentAnalytics = await loadAnalytics();
    updateDashboard(currentAnalytics);
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

// Update the dashboard with analytics data
function updateDashboard(analytics) {
  // Core stats
  document.getElementById('productivityScore').textContent = analytics.productivityScore || 0;
  document.getElementById('totalBlocked').textContent = analytics.totalBlocked || 0;
  document.getElementById('timeSaved').textContent = Math.round(analytics.timeSaved || 0);
  
  // Today's blocks
  const today = new Date().toDateString();
  const todayBlocks = analytics.timeBasedStats?.daily?.[today] || 0;
  document.getElementById('todayBlocks').textContent = todayBlocks;

  // Update insights
  updateInsights(analytics);
  
  // Update heatmap
  updateHeatmap(analytics);
  
  // Update category chart
  updateCategoryChart(analytics);
  
  // Update goal progress
  updateGoalProgress(analytics);
  
  // Update focus sessions
  updateFocusSessions(analytics);
}

// Update productivity insights
function updateInsights(analytics) {
  const insights = getProductivityInsights(analytics);
  const insightsList = document.getElementById('insightsList');
  
  if (insights.length === 0) {
    insightsList.innerHTML = '<li class="insight-item"><span class="insight-icon">📈</span><span>Keep using the blocker to generate insights!</span></li>';
    return;
  }
  
  insightsList.innerHTML = '';
  insights.forEach(insight => {
    const li = document.createElement('li');
    li.className = 'insight-item';
    
    let icon = '📊';
    if (insight.type === 'peak_hour') icon = '⏰';
    if (insight.type === 'top_category') icon = '📂';
    if (insight.type === 'improving') icon = '📈';
    if (insight.type === 'declining') icon = '📉';
    
    li.innerHTML = `
      <span class="insight-icon">${icon}</span>
      <span>${insight.message}</span>
    `;
    insightsList.appendChild(li);
  });
}

// Update activity heatmap
function updateHeatmap(analytics) {
  const heatmapGrid = document.getElementById('heatmapGrid');
  heatmapGrid.innerHTML = '';
  
  const hourlyStats = analytics.timeBasedStats?.hourly || Array(24).fill(0);
  const maxBlocks = Math.max(...hourlyStats, 1);
  
  for (let hour = 0; hour < 24; hour++) {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    
    const blocks = hourlyStats[hour] || 0;
    const intensity = Math.min(5, Math.ceil((blocks / maxBlocks) * 5));
    
    if (intensity > 0) {
      cell.classList.add(`intensity-${intensity}`);
    }
    
    cell.title = `${hour}:00 - ${blocks} blocks`;
    cell.addEventListener('click', () => {
      alert(`Hour ${hour}:00: ${blocks} blocked attempts`);
    });
    
    heatmapGrid.appendChild(cell);
  }
}

// Update category chart
function updateCategoryChart(analytics) {
  const categoryChart = document.getElementById('categoryChart');
  const categoryStats = analytics.categoryStats || {};
  
  const total = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    categoryChart.innerHTML = '<div class="empty-state">No category data yet.</div>';
    return;
  }
  
  categoryChart.innerHTML = '';
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    if (count > 0) {
      const percentage = Math.round((count / total) * 100);
      
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <div style="font-weight: bold; text-transform: capitalize;">${category}</div>
        <div class="category-bar">
          <div class="category-progress" style="width: ${percentage}%"></div>
        </div>
        <div>${count} blocks (${percentage}%)</div>
      `;
      
      categoryChart.appendChild(categoryItem);
    }
  });
}

// Update goal progress
function updateGoalProgress(analytics) {
  const goalProgress = document.getElementById('goalProgress');
  const progress = getGoalProgress(analytics);
  
  let hasGoals = false;
  let progressHTML = '';
  
  if (progress.dailyBlocks.goal) {
    hasGoals = true;
    const blocksProgress = Math.max(0, progress.dailyBlocks.progress || 0);
    progressHTML += `
      <div style="margin-bottom: 20px;">
        <h4>Daily Block Goal: Stay under ${progress.dailyBlocks.goal} blocks</h4>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${100 - blocksProgress}%; background: ${blocksProgress > 100 ? '#dc3545' : '#28a745'}"></div>
        </div>
        <div>Current: ${progress.dailyBlocks.current} / ${progress.dailyBlocks.goal}</div>
      </div>
    `;
  }
  
  if (progress.focusTime.goal) {
    hasGoals = true;
    const focusProgress = Math.min(100, progress.focusTime.progress || 0);
    progressHTML += `
      <div>
        <h4>Focus Time Goal: ${progress.focusTime.goal} minutes</h4>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${focusProgress}%"></div>
        </div>
        <div>Current: ${Math.round(progress.focusTime.current)} / ${progress.focusTime.goal} minutes</div>
      </div>
    `;
  }
  
  if (!hasGoals) {
    goalProgress.innerHTML = '<div class="empty-state">No goals set yet. Configure them in Settings!</div>';
  } else {
    goalProgress.innerHTML = progressHTML;
  }
}

// Update focus sessions
function updateFocusSessions(analytics) {
  const focusSessions = document.getElementById('focusSessions');
  const sessions = analytics.focusSessions || [];
  
  if (sessions.length === 0) {
    focusSessions.innerHTML = '<div class="empty-state">No focus sessions recorded yet.</div>';
    return;
  }
  
  focusSessions.innerHTML = '';
  
  // Show last 10 sessions
  sessions.slice(-10).reverse().forEach(session => {
    const start = new Date(session.start);
    const end = session.end ? new Date(session.end) : new Date();
    const duration = Math.round((end - start) / (1000 * 60)); // minutes
    
    const sessionItem = document.createElement('div');
    sessionItem.className = 'session-item';
    sessionItem.innerHTML = `
      <div>
        <div style="font-weight: bold;">${start.toLocaleDateString()} ${start.toLocaleTimeString()}</div>
        <div style="font-size: 0.9em; color: #666;">
          ${session.blockedAttempts} blocks, ${session.overrides} overrides
        </div>
      </div>
      <div class="session-duration">${duration} min</div>
    `;
    
    focusSessions.appendChild(sessionItem);
  });
}

// Close window function
function closeWindow() {
  window.close();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadAllAnalytics();
  
  // Add event listener for refresh button
  document.querySelector('.refresh-btn').addEventListener('click', loadAllAnalytics);
  
  // Add event listener for close button
  document.getElementById('closeBtn').addEventListener('click', closeWindow);
});
