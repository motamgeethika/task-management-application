// List / Table View Component

class TaskListComponent {
  constructor(container) {
    this.container = container;
    this.sortField = 'createdAt';
    this.sortOrder = 'desc';
  }

  render() {
    const tasks = this.getFilteredAndSortedTasks();
    const users = window.appState.get('users') || [];

    this.container.innerHTML = `
      <div class="list-view-container">
        <table class="tasks-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="title">
                Task Name ${this.renderSortArrow('title')}
              </th>
              <th class="sortable" data-sort="category">
                Category ${this.renderSortArrow('category')}
              </th>
              <th class="sortable" data-sort="priority">
                Priority ${this.renderSortArrow('priority')}
              </th>
              <th class="sortable" data-sort="status">
                Status ${this.renderSortArrow('status')}
              </th>
              <th>Assignee</th>
              <th class="sortable" data-sort="dueDate">
                Due Date ${this.renderSortArrow('dueDate')}
              </th>
              <th>Subtasks</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.length > 0 ? tasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const isOverdue = window.Utils.isOverdue(task.dueDate, task.status);
              const subtasks = task.subtasks || [];
              const completedCount = subtasks.filter(s => s.completed).length;

              return `
                <tr class="table-row" data-task-id="${task.id}">
                  <td>
                    <div class="task-title-cell">
                      <span class="task-table-title">${window.Utils.escapeHTML(task.title)}</span>
                      ${task.description ? `<span class="task-table-desc">${window.Utils.escapeHTML(task.description)}</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <span class="category-tag">${window.Utils.escapeHTML(task.category || 'General')}</span>
                  </td>
                  <td>
                    <span class="priority-badge priority-${task.priority}">
                      ${task.priority}
                    </span>
                  </td>
                  <td>
                    <select class="status-select-inline list-status-select" data-task-id="${task.id}">
                      <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                      <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                      <option value="review" ${task.status === 'review' ? 'selected' : ''}>In Review</option>
                      <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                  </td>
                  <td>
                    <div class="table-assignee">
                      ${assignee ? `
                        <img src="${assignee.avatar}" alt="${window.Utils.escapeHTML(assignee.name)}" class="card-assignee" />
                        <span style="font-size: 0.8rem;">${window.Utils.escapeHTML(assignee.name.split(' ')[0])}</span>
                      ` : `
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Unassigned</span>
                      `}
                    </div>
                  </td>
                  <td>
                    ${task.dueDate ? `
                      <span class="due-date-pill ${isOverdue ? 'overdue' : ''}">
                        ${window.Utils.formatDate(task.dueDate)}
                      </span>
                    ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>'}
                  </td>
                  <td>
                    ${subtasks.length > 0 ? `
                      <span style="font-size: 0.775rem; color: var(--text-secondary); font-weight: 600;">
                        ${completedCount}/${subtasks.length}
                      </span>
                    ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>'}
                  </td>
                  <td>
                    <div class="table-actions" style="justify-content: flex-end;">
                      <button class="card-mini-btn edit-list-task-btn" data-task-id="${task.id}" title="Edit Task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button class="card-mini-btn del-btn delete-list-task-btn" data-task-id="${task.id}" title="Delete Task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                  No tasks match your current filters.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;

    this.bindEvents(tasks);
  }

  renderSortArrow(field) {
    if (this.sortField !== field) return '';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  getFilteredAndSortedTasks() {
    let tasks = window.appState.get('tasks') || [];
    const filters = window.appState.get('filters');
    const currentUser = window.appState.get('currentUser');

    if (filters.status && filters.status !== 'all') {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    if (filters.category && filters.category !== 'all') {
      tasks = tasks.filter(t => (t.category || '').toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.assigneeId && filters.assigneeId !== 'all') {
      if (filters.assigneeId === 'me' && currentUser) {
        tasks = tasks.filter(t => t.assigneeId === currentUser.id);
      } else if (filters.assigneeId === 'unassigned') {
        tasks = tasks.filter(t => !t.assigneeId);
      } else {
        tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
      }
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Sort
    const field = this.sortField;
    const order = this.sortOrder;

    return [...tasks].sort((a, b) => {
      let valA = a[field] || '';
      let valB = b[field] || '';

      if (field === 'priority') {
        const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
        valA = priorityWeights[valA] || 0;
        valB = priorityWeights[valB] || 0;
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  bindEvents(tasks) {
    // Sorting on headers
    this.container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (this.sortField === field) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortOrder = 'asc';
        }
        this.render();
      });
    });

    // Inline status change
    this.container.querySelectorAll('.list-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const taskId = e.target.dataset.taskId;
        const newStatus = e.target.value;
        try {
          await window.Api.updateStatus(taskId, newStatus);
          window.appState.updateTaskStatus(taskId, newStatus);
          if (newStatus === 'completed') window.Utils.playChime('success');
          window.Toast.success('Status Updated', `Moved to ${newStatus.replace('_', ' ')}`);
        } catch (err) {
          window.Toast.error('Update Failed', err.message);
        }
      });
    });

    // Edit button
    this.container.querySelectorAll('.edit-list-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        const task = tasks.find(t => t.id === taskId);
        if (task) window.taskModal.openForEdit(task);
      });
    });

    // Delete button
    this.container.querySelectorAll('.delete-list-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        const task = tasks.find(t => t.id === taskId);
        if (task && confirm(`Delete "${task.title}"?`)) {
          try {
            await window.Api.deleteTask(taskId);
            window.appState.removeTask(taskId);
            window.Toast.info('Deleted', `Removed "${task.title}"`);
          } catch (err) {
            window.Toast.error('Delete Failed', err.message);
          }
        }
      });
    });
  }
}

window.TaskListComponent = TaskListComponent;
