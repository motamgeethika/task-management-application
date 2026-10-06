const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/config');
const { initWebSocketServer } = require('./websocket/socketServer');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const statsRoutes = require('./routes/statsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/activities', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Single Page Application fallback for any non-API routes (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(publicPath, 'index.html'));
  }
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  next();
});

// Error handling middleware
app.use(errorHandler);

// Initialize WebSocket server attached to the HTTP server
initWebSocketServer(server);

// Start listening
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 TaskMaster Pro Server running at: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket gateway listening at: ws://localhost:${PORT}/ws`);
  console.log(`===============================================`);
});

module.exports = { app, server };
