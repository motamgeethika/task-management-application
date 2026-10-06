// Task Card Component

const TaskCard = {
  render(task, users = []) {
    const assignee = users.find(u => u.id === task.assigneeId);
    const isOverdue = window.Utils.isOverdue(task.dueDate, task.status);
    const formattedDate = window.Utils.formatDate(task.dueDate);

    // Calculate subtask completion
    const subtasks = task.subtasks || [];
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(s => s.completed).length;
    const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return `
      <div class="task-card" draggable="true" data-task-id="${task.id}" id="card-${task.id}">
        <!-- Tags & Priority Header -->
        <div class="card-tags-row">
          <span class="category-tag">${window.Utils.escapeHTML(task.category || 'General')}</span>
          <span class="priority-badge priority-${task.priority}">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
            ${task.priority}
          </span>
        </div>

        <!-- Title & Description -->
        <div class="card-title">${window.Utils.escapeHTML(task.title)}</div>
        ${task.description ? `<div class="card-desc">${window.Utils.escapeHTML(task.description)}</div>` : ''}

        <!-- Subtasks Progress Bar -->
        ${totalSubtasks > 0 ? `
          <div class="subtasks-progress">
            <div class="progress-header">
              <span>Subtasks</span>
              <span>${completedSubtasks}/${totalSubtasks} (${progressPercent}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        ` : ''}

        <!-- Footer Meta -->
        <div class="card-footer">
          <div class="card-meta-left">
            ${formattedDate ? `
              <span class="due-date-pill ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? 'Task is Overdue!' : 'Due date'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${formattedDate}
              </span>
            ` : ''}

            ${assignee ? `
              <img src="${assignee.avatar}" alt="${window.Utils.escapeHTML(assignee.name)}" class="card-assignee" title="Assigned to ${window.Utils.escapeHTML(assignee.name)}" />
            ` : ''}
          </div>

          <div class="card-actions-right">
            <!-- Mobile / Quick Status Shift Dropdown -->
            <select class="status-select-inline quick-status-shift" data-task-id="${task.id}" title="Move status">
              <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
              <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Prog</option>
              <option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option>
              <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Done</option>
            </select>

            <button class="card-mini-btn edit-task-btn" data-task-id="${task.id}" title="Edit task">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>

            <button class="card-mini-btn del-btn delete-task-btn" data-task-id="${task.id}" title="Delete task">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindCardEvents(cardElement, task) {
    // Drag Start
    cardElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
      cardElement.classList.add('dragging');
    });

    // Drag End
    cardElement.addEventListener('dragend', () => {
      cardElement.classList.remove('dragging');
      document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
    });

    // Edit button
    const editBtn = cardElement.querySelector('.edit-task-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.taskModal.openForEdit(task);
      });
    }

    // Delete button
    const delBtn = cardElement.querySelector('.delete-task-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
          try {
            await window.Api.deleteTask(task.id);
            window.appState.removeTask(task.id);
            window.Toast.info('Deleted', `Removed "${task.title}"`);
          } catch (err) {
            window.Toast.error('Delete Failed', err.message);
          }
        }
      });
    }

    // Inline status shift selector
    const shiftSelect = cardElement.querySelector('.quick-status-shift');
    if (shiftSelect) {
      shiftSelect.addEventListener('change', async (e) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        try {
          await window.Api.updateStatus(task.id, newStatus);
          window.appState.updateTaskStatus(task.id, newStatus);
          if (newStatus === 'completed') window.Utils.playChime('success');
          window.Toast.success('Status Updated', `Moved to ${newStatus.replace('_', ' ')}`);
        } catch (err) {
          window.Toast.error('Move Failed', err.message);
          e.target.value = task.status; // Revert
        }
      });
    }

    // Double click to open edit
    cardElement.addEventListener('dblclick', () => {
      window.taskModal.openForEdit(task);
    });
  }
};

window.TaskCard = TaskCard;
