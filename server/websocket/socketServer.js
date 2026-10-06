const { WebSocketServer, WebSocket } = require('ws');

let wss = null;
let activeClients = new Map(); // ws -> { userId, userName, userAvatar, connectedAt }

const initWebSocketServer = (server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = 'conn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    
    // Store default client state
    activeClients.set(ws, {
      id: clientId,
      userId: null,
      userName: 'Guest',
      userAvatar: null,
      connectedAt: new Date().toISOString()
    });

    // Send welcome payload and current connected count
    sendToClient(ws, {
      type: 'INIT_CONNECTION',
      clientId,
      activeUsersCount: getUniqueActiveUsersCount(),
      timestamp: new Date().toISOString()
    });

    // Broadcast updated presence to all clients
    broadcastPresence();

    ws.on('message', (messageRaw) => {
      try {
        const message = JSON.parse(messageRaw);
        handleClientMessage(ws, message);
      } catch (err) {
        console.error('Error handling WS message:', err.message);
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
      broadcastPresence();
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err.message);
      activeClients.delete(ws);
      broadcastPresence();
    });
  });

  console.log('⚡ WebSocket server initialized on path /ws');
  return wss;
};

const handleClientMessage = (ws, message) => {
  const clientData = activeClients.get(ws);
  if (!clientData) return;

  switch (message.type) {
    case 'IDENTIFY_USER':
      if (message.user) {
        clientData.userId = message.user.id;
        clientData.userName = message.user.name;
        clientData.userAvatar = message.user.avatar;
        broadcastPresence();
      }
      break;

    case 'USER_TYPING':
      // Broadcast typing indicator to others
      broadcastExcept(ws, {
        type: 'USER_TYPING',
        userId: clientData.userId,
        userName: clientData.userName,
        taskId: message.taskId
      });
      break;

    case 'PING':
      sendToClient(ws, { type: 'PONG', timestamp: Date.now() });
      break;

    default:
      break;
  }
};

const sendToClient = (ws, payload) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const getUniqueActiveUsersCount = () => {
  return activeClients.size;
};

const getActiveUsersList = () => {
  const users = [];
  activeClients.forEach((data) => {
    if (data.userId) {
      if (!users.some(u => u.userId === data.userId)) {
        users.push({
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar
        });
      }
    }
  });
  return users;
};

const broadcastPresence = () => {
  const payload = {
    type: 'PRESENCE_SYNC',
    activeCount: activeClients.size,
    activeUsers: getActiveUsersList(),
    timestamp: new Date().toISOString()
  };
  broadcast(payload);
};

const broadcast = (payload) => {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

const broadcastExcept = (senderWs, payload) => {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

module.exports = {
  initWebSocketServer,
  broadcast,
  broadcastExcept
};
