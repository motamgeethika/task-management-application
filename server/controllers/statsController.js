const db = require('../data/database');

exports.getStats = (req, res) => {
  try {
    const tasks = db.getTasks();
    const users = db.getUsers();

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const inReview = tasks.filter(t => t.status === 'review').length;
    const todo = tasks.filter(t => t.status === 'todo').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Overdue tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;

    // Priority breakdown
    const priorityBreakdown = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    // Category breakdown
    const categoryBreakdown = {};
    tasks.forEach(t => {
      const cat = t.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    // Workload by user
    const workload = users.map(u => {
      const userTasks = tasks.filter(t => t.assigneeId === u.id);
      return {
        userId: u.id,
        userName: u.name,
        userAvatar: u.avatar,
        role: u.role,
        assignedCount: userTasks.length,
        completedCount: userTasks.filter(t => t.status === 'completed').length
      };
    });

    return res.json({
      success: true,
      stats: {
        total,
        completed,
        inProgress,
        inReview,
        todo,
        completionRate,
        overdue,
        priorityBreakdown,
        categoryBreakdown,
        workload
      }
    });
  } catch (err) {
    console.error('Error computing stats:', err);
    return res.status(500).json({ success: false, message: 'Server error computing stats.' });
  }
};
