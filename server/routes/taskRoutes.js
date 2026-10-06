const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

// Read operations can use optionalAuth so guests can view the board
router.get('/', optionalAuth, taskController.getTasks);
router.get('/:id', optionalAuth, taskController.getTaskById);

// Create, Update, Delete with optionalAuth (falls back to demo user if no token, works seamlessly)
router.post('/', optionalAuth, taskController.createTask);
router.put('/:id', optionalAuth, taskController.updateTask);
router.patch('/:id/status', optionalAuth, taskController.updateStatus);
router.patch('/:id/subtasks/:subtaskId', optionalAuth, taskController.toggleSubtask);
router.delete('/:id', optionalAuth, taskController.deleteTask);

module.exports = router;
