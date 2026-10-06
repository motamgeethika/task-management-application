// Main Application Orchestrator

class App {
  constructor() {
    this.navbarContainer = document.getElementById('navbarContainer');
    this.controlBarContainer = document.getElementById('controlBarContainer');
    this.viewContainer = document.getElementById('viewContainer');

    this.kanbanView = new window.KanbanBoardComponent(this.viewContainer);
    this.listView = new window.TaskListComponent(this.viewContainer);
    this.analyticsView = new window.AnalyticsViewComponent(this.viewContainer);

    this.init();
  }

  async init() {
    // 1. Initialize Navbar
    new window.NavbarComponent(this.navbarContainer);

    // 2. Render Filters / Control Bar
    this.renderControlBar();

    // 3. Load Initial Data
    await this.loadInitialData();

    // 4. Initial View Render
    this.renderCurrentView();

    // 5. Subscribe to State Changes for Reactive Re-rendering
    this.subscribeState();

    // 6. Setup Global Keyboard Shortcuts
    this.setupShortcuts();
  }

  async loadInitialData() {
    try {
      // Fetch users
      const usersRes = await window.Api.getUsers();
      window.appState.set('users', usersRes.users || []);

      // Verify token if present
      if (window.appState.get('token')) {
        try {
          const meRes = await window.Api.getMe();
          window.appState.setUser(meRes.user, window.appState.get('token'));
        } catch {
          // Token expired, reset to guest
          window.appState.setUser(null, null);
        }
      }

      // Fetch initial tasks
      const tasksRes = await window.Api.getTasks();
      window.appState.set('tasks', tasksRes.tasks || []);

      // If no user is logged in, default to the first demo user (Alex Rivera) for instant interaction delight!
      if (!window.appState.get('currentUser') && usersRes.users && usersRes.users.length > 0) {
        const demoUser = usersRes.users[0];
        try {
          const demoLogin = await window.Api.loginDemo(demoUser.id);
          window.appState.setUser(demoLogin.user, demoLogin.token);
        } catch {
          // Guest mode fallback
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      window.Toast.error('Connection Warning', 'Could not fetch initial data from server.');
    }
  }

  renderControlBar() {
    const filters = window.appState.get('filters');
    const users = window.appState.get('users') || [];

    this.controlBarContainer.innerHTML = `
      <section class="control-bar" aria-label="Task Filters and Search">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" class="search-input" id="globalSearchInput" placeholder="Search tasks by title, description or tag... (Press / to focus)" value="${window.Utils.escapeHTML(filters.search)}" />
        </div>

        <div class="filter-group">
          <!-- Status Filter -->
          <select class="select-filter" id="filterStatus" aria-label="Filter by Status">
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
          </select>

          <!-- Priority Filter -->
          <select class="select-filter" id="filterPriority" aria-label="Filter by Priority">
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <!-- Category Filter -->
          <select class="select-filter" id="filterCategory" aria-label="Filter by Category">
            <option value="all">All Categories</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="DevOps">DevOps</option>
            <option value="Marketing">Marketing</option>
            <option value="Research">Research</option>
          </select>

          <!-- Assignee Filter -->
          <select class="select-filter" id="filterAssignee" aria-label="Filter by Assignee">
            <option value="all">All Assignees</option>
            <option value="me">My Tasks</option>
            <option value="unassigned">Unassigned</option>
            ${users.map(u => `<option value="${u.id}">${window.Utils.escapeHTML(u.name)}</option>`).join('')}
          </select>

          <button class="btn btn-ghost" id="clearFiltersBtn" title="Reset all filters" style="font-size: 0.8rem; padding: 0.45rem 0.75rem;">
            Reset
          </button>
        </div>
      </section>
    `;

    this.bindControlBarEvents();
  }

  bindControlBarEvents() {
    const searchInput = this.controlBarContainer.querySelector('#globalSearchInput');
    const statusSelect = this.controlBarContainer.querySelector('#filterStatus');
    const prioritySelect = this.controlBarContainer.querySelector('#filterPriority');
    const catSelect = this.controlBarContainer.querySelector('#filterCategory');
    const assigneeSelect = this.controlBarContainer.querySelector('#filterAssignee');
    const clearBtn = this.controlBarContainer.querySelector('#clearFiltersBtn');

    // Debounced search
    const handleSearch = window.Utils.debounce((e) => {
      const filters = { ...window.appState.get('filters'), search: e.target.value };
      window.appState.set('filters', filters);
    }, 250);

    if (searchInput) searchInput.addEventListener('input', handleSearch);

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        const filters = { ...window.appState.get('filters'), status: e.target.value };
        window.appState.set('filters', filters);
      });
    }

    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        const filters = { ...window.appState.get('filters'), priority: e.target.value };
        window.appState.set('filters', filters);
      });
    }

    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        const filters = { ...window.appState.get('filters'), category: e.target.value };
        window.appState.set('filters', filters);
      });
    }

    if (assigneeSelect) {
      assigneeSelect.addEventListener('change', (e) => {
        const filters = { ...window.appState.get('filters'), assigneeId: e.target.value };
        window.appState.set('filters', filters);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (statusSelect) statusSelect.value = 'all';
        if (prioritySelect) prioritySelect.value = 'all';
        if (catSelect) catSelect.value = 'all';
        if (assigneeSelect) assigneeSelect.value = 'all';

        window.appState.set('filters', {
          status: 'all',
          priority: 'all',
          category: 'all',
          assigneeId: 'all',
          search: ''
        });
      });
    }
  }

  renderCurrentView() {
    const currentView = window.appState.get('currentView');

    // Toggle control bar visibility: hide filters on Analytics view for cleaner UI
    if (this.controlBarContainer) {
      this.controlBarContainer.style.display = currentView === 'analytics' ? 'none' : 'block';
    }

    if (currentView === 'kanban') {
      this.kanbanView.render();
    } else if (currentView === 'list') {
      this.listView.render();
    } else if (currentView === 'analytics') {
      this.analyticsView.render();
    }
  }

  subscribeState() {
    window.appState.subscribe('currentView', () => {
      this.renderCurrentView();
    });

    window.appState.subscribe('tasks', () => {
      this.renderCurrentView();
    });

    window.appState.subscribe('filters', () => {
      this.renderCurrentView();
    });

    window.appState.subscribe('users', () => {
      this.renderControlBar();
    });
  }

  setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input/textarea
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.focus();
      }

      if ((e.key === 'n' || e.key === 'N') && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.taskModal.openForCreate();
      }

      if (e.key === 'Escape') {
        window.authModal.close();
        window.taskModal.close();
      }
    });
  }
}

// Bootstrap app on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
