const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const db = require('../data/database');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please sign in.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session expired or user no longer exists.'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.getUserById(decoded.id);
      if (user) req.user = user;
    } catch (err) {
      // Ignore invalid token for optional auth
    }
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};
