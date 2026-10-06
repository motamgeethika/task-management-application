// Real-time WebSocket Client Manager

class RealtimeClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.reconnectDelay = 2000;
    this.pingInterval = null;
    this.init();
  }

  init() {
    this.connect();

    // Re-identify when user changes
    window.appState.subscribe('currentUser', (user) => {
      if (user && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.identifyUser(user);
      }
    });
  }

  connect() {
    try {
      this.ws = new WebSocket(window.AppConfig.WS_URL);

      this.ws.onopen = () => {
        console.log('⚡ Connected to real-time WebSocket server');
        this.reconnectAttempts = 0;
        window.appState.set('wsConnected', true);

        // Identify current user if logged in
        const currentUser = window.appState.get('currentUser');
        if (currentUser) {
          this.identifyUser(currentUser);
        }

        // Start heartbeat ping
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleMessage(payload);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        console.warn('⚠️ WebSocket disconnected. Reconnecting...');
        window.appState.set('wsConnected', false);
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket encountered error:', err);
        this.ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 10000);
      setTimeout(() => this.connect(), delay);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  identifyUser(user) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'IDENTIFY_USER',
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      }));
    }
  }

  handleMessage(msg) {
    const currentUserId = window.appState.get('currentUser')?.id;
    const isMe = msg.sender && msg.sender.id === currentUserId;

    switch (msg.type) {
      case 'PRESENCE_SYNC':
        window.appState.set('activeUsersCount', msg.activeCount || 1);
        window.appState.set('activeUsers', msg.activeUsers || []);
        break;

      case 'TASK_CREATED':
        window.appState.upsertTask(msg.task);
        if (!isMe) {
          window.Toast.info(
            'New Task Created',
            `${msg.sender?.name || 'A team member'} added "${msg.task.title}"`
          );
          window.Utils.playChime('notify');
        }
        break;

      case 'TASK_UPDATED':
        window.appState.upsertTask(msg.task);
        if (!isMe && msg.sender) {
          window.Toast.info(
            'Task Updated',
            `${msg.sender.name} updated "${msg.task.title}"`
          );
        }
        break;

      case 'TASK_STATUS_CHANGED':
        window.appState.updateTaskStatus(msg.taskId, msg.status);
        if (msg.task) {
          window.appState.upsertTask(msg.task);
        }
        if (msg.status === 'completed') {
          window.Utils.playChime('success');
        }
        if (!isMe && msg.sender) {
          window.Toast.info(
            'Task Moved',
            `${msg.sender.name} moved "${msg.task?.title || 'task'}" to ${msg.status.replace('_', ' ')}`
          );
        }
        break;

      case 'TASK_DELETED':
        window.appState.removeTask(msg.taskId);
        if (!isMe && msg.sender) {
          window.Toast.warning(
            'Task Removed',
            `${msg.sender.name} deleted a task`
          );
        }
        break;

      default:
        break;
    }
  }
}

window.realtimeClient = new RealtimeClient();
