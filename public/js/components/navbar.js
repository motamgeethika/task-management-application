// Navbar Component

class NavbarComponent {
  constructor(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.subscribeState();
  }

  render() {
    const user = window.appState.get('currentUser');
    const view = window.appState.get('currentView');
    const isWs = window.appState.get('wsConnected');
    const onlineCount = window.appState.get('activeUsersCount') || 1;
    const theme = window.appState.get('theme');

    this.container.innerHTML = `
      <nav class="navbar" role="navigation" aria-label="Main Navigation">
        <!-- Brand -->
        <div class="nav-brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>TaskMaster</span>
          <span class="brand-badge">PRO</span>
        </div>

        <!-- View Switcher -->
        <div class="view-switcher" role="tablist">
          <button class="view-btn ${view === 'kanban' ? 'active' : ''}" data-view="kanban" id="viewBtnKanban" role="tab" aria-selected="${view === 'kanban'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/>
            </svg>
            Kanban
          </button>
          <button class="view-btn ${view === 'list' ? 'active' : ''}" data-view="list" id="viewBtnList" role="tab" aria-selected="${view === 'list'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            List
          </button>
          <button class="view-btn ${view === 'analytics' ? 'active' : ''}" data-view="analytics" id="viewBtnAnalytics" role="tab" aria-selected="${view === 'analytics'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Analytics
          </button>
        </div>

        <!-- Right Side: Socket Status, Theme, User Profile -->
        <div class="nav-actions">
          <div class="ws-status-badge ${isWs ? 'connected' : 'disconnected'}" id="wsBadge" title="${isWs ? 'Connected to live gateway' : 'Reconnecting...'}">
            <span class="pulse-dot"></span>
            <span id="wsText">${isWs ? `Live (${onlineCount})` : 'Offline'}</span>
          </div>

          <button class="btn-icon" id="themeToggleBtn" title="Toggle Light / Dark mode" aria-label="Toggle theme">
            ${theme === 'dark' ? `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            `}
          </button>

          <button class="btn btn-primary" id="headerNewTaskBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>New Task</span>
          </button>

          ${user ? `
            <div class="user-menu-btn" id="userMenuBtn" title="Logged in as ${window.Utils.escapeHTML(user.name)} (${window.Utils.escapeHTML(user.role)})">
              <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${window.Utils.escapeHTML(user.name)}" class="avatar" />
              <span class="user-name-label">${window.Utils.escapeHTML(user.name)}</span>
            </div>
          ` : `
            <button class="btn btn-secondary" id="authOpenBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Sign In</span>
            </button>
          `}
        </div>
      </nav>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        window.appState.set('currentView', view);
      });
    });

    const themeBtn = this.container.querySelector('#themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        window.appState.toggleTheme();
      });
    }

    const newTaskBtn = this.container.querySelector('#headerNewTaskBtn');
    if (newTaskBtn) {
      newTaskBtn.addEventListener('click', () => {
        window.taskModal.openForCreate();
      });
    }

    const authBtn = this.container.querySelector('#authOpenBtn');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        window.authModal.open();
      });
    }

    const userMenuBtn = this.container.querySelector('#userMenuBtn');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', () => {
        window.authModal.open(true); // Open in profile / switcher mode
      });
    }
  }

  subscribeState() {
    window.appState.subscribe('currentView', () => this.renderAndRebind());
    window.appState.subscribe('currentUser', () => this.renderAndRebind());
    window.appState.subscribe('theme', () => this.renderAndRebind());
    window.appState.subscribe('wsConnected', (isWs) => {
      const badge = this.container.querySelector('#wsBadge');
      const text = this.container.querySelector('#wsText');
      const count = window.appState.get('activeUsersCount') || 1;
      if (badge && text) {
        badge.className = `ws-status-badge ${isWs ? 'connected' : 'disconnected'}`;
        text.innerText = isWs ? `Live (${count})` : 'Offline';
      }
    });
    window.appState.subscribe('activeUsersCount', (count) => {
      const isWs = window.appState.get('wsConnected');
      const text = this.container.querySelector('#wsText');
      if (text && isWs) {
        text.innerText = `Live (${count})`;
      }
    });
  }

  renderAndRebind() {
    this.render();
    this.bindEvents();
  }
}

window.NavbarComponent = NavbarComponent;
