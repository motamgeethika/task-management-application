const db = require('../data/database');
const { broadcast } = require('../websocket/socketServer');

exports.getTasks = (req, res) => {
  try {
    let tasks = db.getTasks();
    const { status, priority, category, assigneeId, search, sort, order } = req.query;

    // Filter by status
    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status === status);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      tasks = tasks.filter(t => t.priority === priority);
    }

    // Filter by category
    if (category && category !== 'all') {
      tasks = tasks.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by assignee
    if (assigneeId && assigneeId !== 'all') {
      if (assigneeId === 'unassigned') {
        tasks = tasks.filter(t => !t.assigneeId);
      } else if (assigneeId === 'me' && req.user) {
        tasks = tasks.filter(t => t.assigneeId === req.user.id);
      } else {
        tasks = tasks.filter(t => t.assigneeId === assigneeId);
      }
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Sorting
    const sortField = sort || 'createdAt';
    const sortOrder = (order || 'desc').toLowerCase();

    tasks.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'priority') {
        const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
        valA = priorityWeights[valA] || 0;
        valB = priorityWeights[valB] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving tasks.' });
  }
};

exports.getTaskById = (req, res) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  return res.json({ success: true, task });
};

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      category = 'Development',
      assigneeId = null,
      dueDate = null,
      estimatedHours = 0,
      tags = [],
      subtasks = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const newTask = {
      id: 'task-' + Date.now(),
      title: title.trim(),
      description: (description || '').trim(),
      status: ['todo', 'in_progress', 'review', 'completed'].includes(status) ? status : 'todo',
      priority: ['urgent', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium',
      category: category || 'General',
      assigneeId: assigneeId || null,
      createdBy: req.user ? req.user.id : 'usr-1',
      dueDate: dueDate || null,
      estimatedHours: Number(estimatedHours) || 0,
      tags: Array.isArray(tags) ? tags : [],
      subtasks: Array.isArray(subtasks)
        ? subtasks.map(s => ({
            id: s.id || 'sub-' + Math.random().toString(36).substr(2, 6),
            title: typeof s === 'string' ? s : s.title,
            completed: Boolean(s.completed)
          }))
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdTask = await db.createTask(newTask);

    const activity = await db.addActivity({
      type: 'task_created',
      userId: req.user ? req.user.id : 'usr-1',
      userName: req.user ? req.user.name : 'Team Member',
      userAvatar: req.user ? req.user.avatar : null,
      taskId: createdTask.id,
      taskTitle: createdTask.title,
      details: `Created task in ${createdTask.category}`
    });

    // Real-time WebSocket broadcast
    broadcast({
      type: 'TASK_CREATED',
      task: createdTask,
      activity,
      sender: req.user ? { id: req.user.id, name: req.user.name } : null
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task: createdTask
    });
  } catch (err) {
    console.error('Error creating task:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating task.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const updates = { ...req.body };
    delete updates.id; // Prevent overriding id
    delete updates.createdAt;

    const previousStatus = existing.status;
    const updatedTask = await db.updateTask(id, updates);

    let activityType = 'task_updated';
    let activityDetails = 'Updated task details';

    if (updates.status && updates.status !== previousStatus) {
      activityType = updates.status === 'completed' ? 'task_completed' : 'status_changed';
      activityDetails = `Moved status from ${previousStatus} to ${updates.status}`;
    }

    const activity = await db.addActivity({
      type: activityType,
      userId: req.user ? req.user.id : 'usr-1',
      userName: req.user ? req.user.name : 'Team Member',
      userAvatar: req.user ? req.user.avatar : null,
      taskId: updatedTask.id,
      taskTitle: updatedTask.title,
      details: activityDetails
    });

    // Real-time WebSocket broadcast
    broadcast({
      type: 'TASK_UPDATED',
      task: updatedTask,
      activity,
      sender: req.user ? { id: req.user.id, name: req.user.name } : null
    });

    return res.json({
      success: true,
      message: 'Task updated successfully!',
      task: updatedTask
    });
  } catch (err) {
    console.error('Error updating task:', err);
    return res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['todo', 'in_progress', 'review', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status.' });
    }

    const existing = db.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const previousStatus = existing.status;
    const updatedTask = await db.updateTask(id, { status });

    const activity = await db.addActivity({
      type: status === 'completed' ? 'task_completed' : 'status_changed',
      userId: req.user ? req.user.id : 'usr-1',
      userName: req.user ? req.user.name : 'Team Member',
      userAvatar: req.user ? req.user.avatar : null,
      taskId: updatedTask.id,
      taskTitle: updatedTask.title,
      details: `Moved from ${previousStatus.replace('_', ' ')} to ${status.replace('_', ' ')}`
    });

    // Real-time broadcast
    broadcast({
      type: 'TASK_STATUS_CHANGED',
      taskId: updatedTask.id,
      status: updatedTask.status,
      task: updatedTask,
      activity,
      sender: req.user ? { id: req.user.id, name: req.user.name } : null
    });

    return res.json({
      success: true,
      task: updatedTask,
      message: `Status updated to ${status}`
    });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const deletedTask = await db.deleteTask(id);

    const activity = await db.addActivity({
      type: 'task_deleted',
      userId: req.user ? req.user.id : 'usr-1',
      userName: req.user ? req.user.name : 'Team Member',
      userAvatar: req.user ? req.user.avatar : null,
      taskId: id,
      taskTitle: existing.title,
      details: 'Deleted task from board'
    });

    // Broadcast deletion
    broadcast({
      type: 'TASK_DELETED',
      taskId: id,
      activity,
      sender: req.user ? { id: req.user.id, name: req.user.name } : null
    });

    return res.json({
      success: true,
      message: 'Task deleted successfully!',
      taskId: id
    });
  } catch (err) {
    console.error('Error deleting task:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting task.' });
  }
};

exports.toggleSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;
    const task = db.getTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const subtasks = (task.subtasks || []).map(s => {
      if (s.id === subtaskId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });

    const updatedTask = await db.updateTask(id, { subtasks });

    broadcast({
      type: 'TASK_UPDATED',
      task: updatedTask,
      sender: req.user ? { id: req.user.id, name: req.user.name } : null
    });

    return res.json({
      success: true,
      task: updatedTask
    });
  } catch (err) {
    console.error('Error toggling subtask:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle subtask.' });
  }
};
