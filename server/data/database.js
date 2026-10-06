const fs = require('fs');
const path = require('path');
const { initialUsers, initialTasks, initialActivities } = require('./initialData');

const DB_PATH = path.join(__dirname, 'db.json');

class Database {
  constructor() {
    this.data = {
      users: [],
      tasks: [],
      activities: []
    };
    this.isWriting = false;
    this.writeQueue = [];
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users || this.data.users.length === 0) {
          this.seedInitial();
        }
      } else {
        this.seedInitial();
      }
    } catch (err) {
      console.error('Error loading database, seeding defaults:', err.message);
      this.seedInitial();
    }
  }

  seedInitial() {
    this.data = {
      users: JSON.parse(JSON.stringify(initialUsers)),
      tasks: JSON.parse(JSON.stringify(initialTasks)),
      activities: JSON.parse(JSON.stringify(initialActivities))
    };
    this.saveImmediate();
  }

  saveImmediate() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database immediately:', err.message);
    }
  }

  async persist() {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return;
    this.isWriting = true;
    const currentBatch = [...this.writeQueue];
    this.writeQueue = [];

    try {
      await fs.promises.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
      currentBatch.forEach(item => item.resolve(true));
    } catch (err) {
      console.error('Database write error:', err);
      currentBatch.forEach(item => item.reject(err));
    } finally {
      this.isWriting = false;
      if (this.writeQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  // --- Users ---
  getUsers() {
    return this.data.users.map(({ password, ...u }) => u);
  }

  getUserById(id, includePassword = false) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    if (includePassword) return user;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  getUserByEmail(email, includePassword = false) {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (includePassword) return user;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async createUser(userData) {
    this.data.users.push(userData);
    await this.persist();
    const { password, ...safeUser } = userData;
    return safeUser;
  }

  // --- Tasks ---
  getTasks() {
    return [...this.data.tasks];
  }

  getTaskById(id) {
    return this.data.tasks.find(t => t.id === id) || null;
  }

  async createTask(taskData) {
    this.data.tasks.unshift(taskData);
    await this.persist();
    return taskData;
  }

  async updateTask(id, updates) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.data.tasks[idx],
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString()
    };
    this.data.tasks[idx] = updated;
    await this.persist();
    return updated;
  }

  async deleteTask(id) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const deleted = this.data.tasks.splice(idx, 1)[0];
    await this.persist();
    return deleted;
  }

  // --- Activities ---
  getActivities(limit = 20) {
    return [...this.data.activities].slice(0, limit);
  }

  async addActivity(activity) {
    const entry = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      ...activity
    };
    this.data.activities.unshift(entry);
    if (this.data.activities.length > 100) {
      this.data.activities = this.data.activities.slice(0, 100);
    }
    await this.persist();
    return entry;
  }

  async resetToDemo() {
    this.seedInitial();
    return true;
  }
}

const dbInstance = new Database();
module.exports = dbInstance;
