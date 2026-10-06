// Global Reactive Application State

class AppState {
  constructor() {
    this.listeners = new Map();

    const savedUser = localStorage.getItem('taskmaster_user');
    const savedTheme = localStorage.getItem('taskmaster_theme') || 'dark';

    this.state = {
      currentUser: savedUser ? JSON.parse(savedUser) : null,
      token: localStorage.getItem('taskmaster_token') || null,
      tasks: [],
      users: [],
      activities: [],
      stats: null,
      currentView: 'kanban', // 'kanban', 'list', 'analytics'
      filters: {
        status: 'all',
        priority: 'all',
        category: 'all',
        assigneeId: 'all',
        search: ''
      },
      theme: savedTheme,
      wsConnected: false,
      activeUsersCount: 1,
      activeUsers: []
    };

    // Apply saved theme immediately
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  update(patch) {
    Object.keys(patch).forEach((key) => {
      this.set(key, patch[key]);
    });
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  notify(key, newValue, oldValue) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((cb) => {
        try {
          cb(newValue, oldValue);
        } catch (err) {
          console.error(`Error in state listener for ${key}:`, err);
        }
      });
    }

    // Also notify global wildcard listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((cb) => {
        try {
          cb(key, newValue, oldValue);
        } catch (err) {
          console.error(`Error in wildcard listener:`, err);
        }
      });
    }
  }

  setUser(user, token) {
    this.state.currentUser = user;
    this.state.token = token;
    if (user && token) {
      localStorage.setItem('taskmaster_user', JSON.stringify(user));
      localStorage.setItem('taskmaster_token', token);
    } else {
      localStorage.removeItem('taskmaster_user');
      localStorage.removeItem('taskmaster_token');
    }
    this.notify('currentUser', user);
  }

  toggleTheme() {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.state.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskmaster_theme', newTheme);
    this.notify('theme', newTheme);
  }

  // Task Mutations in State (Optimistic & WebSocket driven)
  upsertTask(task) {
    const tasks = [...this.state.tasks];
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    this.set('tasks', tasks);
  }

  removeTask(taskId) {
    const tasks = this.state.tasks.filter(t => t.id !== taskId);
    this.set('tasks', tasks);
  }

  updateTaskStatus(taskId, newStatus) {
    const tasks = this.state.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    this.set('tasks', tasks);
  }
}

window.appState = new AppState();
