// Analytics Dashboard & Activity Feed Component

class AnalyticsViewComponent {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `
      <div style="display: flex; justify-content: center; padding: 3rem;">
        <span style="color: var(--text-muted);">Loading live productivity metrics...</span>
      </div>
    `;

    try {
      const [statsRes, actRes] = await Promise.all([
        window.Api.getStats(),
        window.Api.getActivities()
      ]);

      const stats = statsRes.stats;
      const activities = actRes.activities || [];

      this.renderContent(stats, activities);
    } catch (err) {
      this.container.innerHTML = `
        <div style="padding: 2rem; color: var(--priority-urgent);">
          Failed to load analytics: ${err.message}
        </div>
      `;
    }
  }

  renderContent(stats, activities) {
    const priorityColors = {
      urgent: '#ef4444',
      high: '#f97316',
      medium: '#3b82f6',
      low: '#64748b'
    };

    const categories = Object.keys(stats.categoryBreakdown || {});
    const maxCatCount = Math.max(...Object.values(stats.categoryBreakdown || { none: 1 }), 1);

    this.container.innerHTML = `
      <div class="analytics-dashboard">
        <!-- Top Metrics Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon-total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div class="metric-content">
              <span class="metric-value">${stats.total}</span>
              <span class="metric-label">Total Tasks</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon-progress">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="metric-content">
              <span class="metric-value">${stats.inProgress + stats.inReview}</span>
              <span class="metric-label">Active / In Progress</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon-completed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="metric-content">
              <span class="metric-value">${stats.completed}</span>
              <span class="metric-label">Completed (${stats.completionRate}%)</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon-overdue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="metric-content">
              <span class="metric-value">${stats.overdue}</span>
              <span class="metric-label">Overdue Tasks</span>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="analytics-grid-two">
          <!-- Priority Distribution Donut -->
          <div class="chart-card">
            <div class="chart-title">
              <span>Priority Distribution</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">By Urgency</span>
            </div>
            <div class="donut-container">
              ${this.renderDonutChart(stats.priorityBreakdown, stats.total, priorityColors)}
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-color" style="background: ${priorityColors.urgent};"></span>
                  <span class="legend-label">Urgent</span>
                  <span class="legend-value">${stats.priorityBreakdown.urgent}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: ${priorityColors.high};"></span>
                  <span class="legend-label">High</span>
                  <span class="legend-value">${stats.priorityBreakdown.high}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: ${priorityColors.medium};"></span>
                  <span class="legend-label">Medium</span>
                  <span class="legend-value">${stats.priorityBreakdown.medium}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: ${priorityColors.low};"></span>
                  <span class="legend-label">Low</span>
                  <span class="legend-value">${stats.priorityBreakdown.low}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Category Breakdown Bars -->
          <div class="chart-card">
            <div class="chart-title">
              <span>Category Breakdown</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${categories.length} Categories</span>
            </div>
            <div class="category-bars-list">
              ${categories.map(cat => {
                const count = stats.categoryBreakdown[cat];
                const pct = Math.round((count / maxCatCount) * 100);
                return `
                  <div class="cat-bar-item">
                    <div class="cat-bar-header">
                      <span>${window.Utils.escapeHTML(cat)}</span>
                      <span>${count} tasks</span>
                    </div>
                    <div class="cat-bar-track">
                      <div class="cat-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Team Workload & Activity Row -->
        <div class="analytics-grid-two">
          <!-- Team Workload -->
          <div class="chart-card">
            <div class="chart-title">
              <span>Team Workload</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${stats.workload.length} Members</span>
            </div>
            <div class="team-workload-grid">
              ${stats.workload.map(w => `
                <div class="workload-card">
                  <img src="${w.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${window.Utils.escapeHTML(w.userName)}" class="workload-avatar" />
                  <div class="workload-info">
                    <span class="workload-name">${window.Utils.escapeHTML(w.userName)}</span>
                    <span class="workload-role">${window.Utils.escapeHTML(w.role || 'Member')}</span>
                  </div>
                  <span class="workload-count-badge" title="${w.completedCount} completed of ${w.assignedCount}">
                    ${w.assignedCount} tasks
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Live Audit Activity Feed -->
          <div class="chart-card">
            <div class="chart-title">
              <span>Recent Activity Feed</span>
              <span style="font-size: 0.8rem; color: var(--accent-primary);">⚡ Real-time Audit</span>
            </div>
            <div class="activity-feed-list">
              ${activities.length > 0 ? activities.slice(0, 8).map(act => `
                <div class="activity-item">
                  <img src="${act.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" class="activity-avatar" alt="${window.Utils.escapeHTML(act.userName)}" />
                  <div class="activity-details">
                    <div class="activity-header">
                      <span class="activity-user">${window.Utils.escapeHTML(act.userName || 'Someone')}</span>
                      ${act.taskTitle ? ` on <em>"${window.Utils.escapeHTML(act.taskTitle)}"</em>` : ''}
                    </div>
                    <div class="activity-text">${window.Utils.escapeHTML(act.details)}</div>
                    <div class="activity-time">${window.Utils.timeAgo(act.timestamp)}</div>
                  </div>
                </div>
              `).join('') : `
                <span style="color: var(--text-muted); font-size: 0.85rem;">No recent activities logged yet.</span>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDonutChart(breakdown, total, colors) {
    if (total === 0) {
      return '<div style="color: var(--text-muted); font-size: 0.85rem;">No task data</div>';
    }

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const segments = ['urgent', 'high', 'medium', 'low'].map(key => {
      const count = breakdown[key] || 0;
      const strokeDasharray = `${(count / total) * circumference} ${circumference}`;
      const strokeDashoffset = -offset;
      offset += (count / total) * circumference;

      return `
        <circle cx="50" cy="50" r="${radius}" fill="transparent"
                stroke="${colors[key]}" stroke-width="12"
                stroke-dasharray="${strokeDasharray}"
                stroke-dashoffset="${strokeDashoffset}" />
      `;
    }).join('');

    return `
      <div style="position: relative; width: 140px; height: 140px;">
        <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%;">
          ${segments}
        </svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-display);">${total}</span>
          <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Tasks</span>
        </div>
      </div>
    `;
  }
}

window.AnalyticsViewComponent = AnalyticsViewComponent;
