// Kanban Board Component

class KanbanBoardComponent {
  constructor(container) {
    this.container = container;
    this.columns = [
      { id: 'todo', title: 'To Do', color: 'todo' },
      { id: 'in_progress', title: 'In Progress', color: 'in_progress' },
      { id: 'review', title: 'In Review', color: 'review' },
      { id: 'completed', title: 'Completed', color: 'completed' }
    ];
  }

  render() {
    const tasks = this.getFilteredTasks();
    const users = window.appState.get('users') || [];

    this.container.innerHTML = `
      <div class="kanban-board" id="kanbanBoard">
        ${this.columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return `
            <div class="kanban-column" data-status="${col.id}" id="col-${col.id}">
              <div class="column-header">
                <div class="column-title-group">
                  <span class="column-indicator ${col.color}"></span>
                  <span class="column-title">${col.title}</span>
                  <span class="column-count-badge">${colTasks.length}</span>
                </div>
                <button class="column-add-btn" data-status="${col.id}" title="Add task to ${col.title}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              <div class="column-body" data-status="${col.id}">
                ${colTasks.length > 0 ? (
                  colTasks.map(task => window.TaskCard.render(task, users)).join('')
                ) : `
                  <div class="empty-column-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <span>No tasks in ${col.title}</span>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindEvents(tasks);
  }

  getFilteredTasks() {
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

    return tasks;
  }

  bindEvents(tasks) {
    // Bind card drag and action events
    this.container.querySelectorAll('.task-card').forEach(cardEl => {
      const taskId = cardEl.dataset.taskId;
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        window.TaskCard.bindCardEvents(cardEl, task);
      }
    });

    // Column Quick Add Buttons
    this.container.querySelectorAll('.column-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const colStatus = e.currentTarget.dataset.status;
        window.taskModal.openForCreate(colStatus);
      });
    });

    // Drag and Drop onto Columns
    this.container.querySelectorAll('.kanban-column').forEach(columnEl => {
      const targetStatus = columnEl.dataset.status;

      columnEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        columnEl.classList.add('drag-over');
      });

      columnEl.addEventListener('dragleave', (e) => {
        // Prevent flashing if hovering children
        if (!columnEl.contains(e.relatedTarget)) {
          columnEl.classList.remove('drag-over');
        }
      });

      columnEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        columnEl.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;

        const task = (window.appState.get('tasks') || []).find(t => t.id === taskId);
        if (!task || task.status === targetStatus) return;

        // Optimistic UI state update
        window.appState.updateTaskStatus(taskId, targetStatus);
        if (targetStatus === 'completed') {
          window.Utils.playChime('success');
        }

        try {
          await window.Api.updateStatus(taskId, targetStatus);
          window.Toast.success('Task Moved', `Moved to ${targetStatus.replace('_', ' ')}`);
        } catch (err) {
          window.Toast.error('Move Failed', err.message);
          window.appState.updateTaskStatus(taskId, task.status); // Rollback
        }
      });
    });
  }
}

window.KanbanBoardComponent = KanbanBoardComponent;
