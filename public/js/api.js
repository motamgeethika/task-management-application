// Centralized REST API Service

const Api = {
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = window.appState.get('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${window.AppConfig.API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async getMe() {
    return this.request('/auth/me');
  },

  async getDemoAccounts() {
    return this.request('/auth/demo-accounts');
  },

  async loginDemo(userId) {
    return this.request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async getUsers() {
    return this.request('/auth/users');
  },

  // Task Endpoints
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] && params[k] !== 'all') {
        query.append(k, params[k]);
      }
    });
    const qs = query.toString();
    return this.request(`/tasks${qs ? '?' + qs : ''}`);
  },

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  },

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  async updateTask(id, updates) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async updateStatus(id, status) {
    return this.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async toggleSubtask(taskId, subtaskId) {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH'
    });
  },

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  },

  // Analytics & Activity Endpoints
  async getStats() {
    return this.request('/stats');
  },

  async getActivities() {
    return this.request('/activities');
  }
};

window.Api = Api;
