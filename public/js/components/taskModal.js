// Create & Edit Task Modal Dialog

class TaskModalComponent {
  constructor() {
    this.modalOverlay = null;
    this.editingTaskId = null;
    this.subtasksList = [];
    this.createDom();
  }

  createDom() {
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.className = 'modal-overlay';
    this.modalOverlay.id = 'taskModalOverlay';
    document.body.appendChild(this.modalOverlay);

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });
  }

  openForCreate(defaultStatus = 'todo') {
    this.editingTaskId = null;
    this.subtasksList = [];
    this.render({
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'medium',
      category: 'Development',
      assigneeId: window.appState.get('currentUser')?.id || '',
      dueDate: '',
      estimatedHours: '',
      tags: []
    });
    this.modalOverlay.classList.add('active');
    setTimeout(() => {
      const input = this.modalOverlay.querySelector('#taskTitleInput');
      if (input) input.focus();
    }, 100);
  }

  openForEdit(task) {
    this.editingTaskId = task.id;
    this.subtasksList = (task.subtasks || []).map(s => ({ ...s }));
    this.render(task);
    this.modalOverlay.classList.add('active');
  }

  close() {
    this.modalOverlay.classList.remove('active');
    this.editingTaskId = null;
  }

  render(data) {
    const isEdit = Boolean(this.editingTaskId);
    const users = window.appState.get('users') || [];

    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            ${isEdit ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button class="btn-icon close-modal-btn" aria-label="Close modal">&times;</button>
        </div>

        <form id="taskForm" class="modal-body">
          <div class="form-group">
            <label class="form-label" for="taskTitleInput">Task Title *</label>
            <input class="form-control" type="text" id="taskTitleInput" placeholder="What needs to be done?" required value="${window.Utils.escapeHTML(data.title)}" />
          </div>

          <div class="form-group">
            <label class="form-label" for="taskDescInput">Description</label>
            <textarea class="form-control" id="taskDescInput" placeholder="Provide context, acceptance criteria, or technical details...">${window.Utils.escapeHTML(data.description || '')}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="taskStatusSelect">Status</label>
              <select class="form-control" id="taskStatusSelect">
                <option value="todo" ${data.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="in_progress" ${data.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="review" ${data.status === 'review' ? 'selected' : ''}>In Review</option>
                <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="taskPrioritySelect">Priority</label>
              <select class="form-control" id="taskPrioritySelect">
                <option value="low" ${data.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                <option value="medium" ${data.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                <option value="high" ${data.priority === 'high' ? 'selected' : ''}>High Priority</option>
                <option value="urgent" ${data.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="taskCategorySelect">Category</label>
              <select class="form-control" id="taskCategorySelect">
                <option value="Development" ${data.category === 'Development' ? 'selected' : ''}>Development</option>
                <option value="Design" ${data.category === 'Design' ? 'selected' : ''}>Design</option>
                <option value="DevOps" ${data.category === 'DevOps' ? 'selected' : ''}>DevOps</option>
                <option value="Marketing" ${data.category === 'Marketing' ? 'selected' : ''}>Marketing</option>
                <option value="Research" ${data.category === 'Research' ? 'selected' : ''}>Research</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="taskAssigneeSelect">Assignee</label>
              <select class="form-control" id="taskAssigneeSelect">
                <option value="">Unassigned</option>
                ${users.map(u => `
                  <option value="${u.id}" ${data.assigneeId === u.id ? 'selected' : ''}>
                    ${window.Utils.escapeHTML(u.name)} (${window.Utils.escapeHTML(u.role)})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="taskDueDateInput">Due Date</label>
              <input class="form-control" type="date" id="taskDueDateInput" value="${data.dueDate || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="taskHoursInput">Estimated Hours</label>
              <input class="form-control" type="number" id="taskHoursInput" min="0" max="999" placeholder="e.g. 8" value="${data.estimatedHours || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="taskTagsInput">Tags (comma separated)</label>
            <input class="form-control" type="text" id="taskTagsInput" placeholder="Frontend, React, Bug" value="${(data.tags || []).join(', ')}" />
          </div>

          <!-- Subtasks Checklist Section -->
          <div class="form-group">
            <label class="form-label">Subtasks & Checklist</label>
            <div class="subtask-input-row">
              <input class="form-control" type="text" id="newSubtaskTitle" placeholder="Add a subtask step..." />
              <button type="button" class="btn btn-secondary" id="addSubtaskBtn" style="white-space: nowrap;">+ Add</button>
            </div>
            <div class="subtasks-editor" id="subtasksListContainer" style="margin-top: 0.5rem;"></div>
          </div>
        </form>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost close-modal-btn">Cancel</button>
          <button type="submit" form="taskForm" class="btn btn-primary" id="saveTaskBtn">
            ${isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    `;

    this.renderSubtasksList();
    this.bindEvents();
  }

  renderSubtasksList() {
    const container = this.modalOverlay.querySelector('#subtasksListContainer');
    if (!container) return;

    if (this.subtasksList.length === 0) {
      container.innerHTML = '<span style="font-size: 0.775rem; color: var(--text-muted); font-style: italic;">No subtasks added yet.</span>';
      return;
    }

    container.innerHTML = this.subtasksList.map((st, idx) => `
      <div class="subtask-item-row">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; flex: 1;">
          <input type="checkbox" class="subtask-check" data-idx="${idx}" ${st.completed ? 'checked' : ''} />
          <span style="${st.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${window.Utils.escapeHTML(st.title)}</span>
        </label>
        <button type="button" class="del-subtask-btn" data-idx="${idx}" title="Remove subtask">&times;</button>
      </div>
    `).join('');

    container.querySelectorAll('.subtask-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.subtasksList[idx].completed = e.target.checked;
        this.renderSubtasksList();
      });
    });

    container.querySelectorAll('.del-subtask-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        this.subtasksList.splice(idx, 1);
        this.renderSubtasksList();
      });
    });
  }

  bindEvents() {
    this.modalOverlay.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    const addSubtaskBtn = this.modalOverlay.querySelector('#addSubtaskBtn');
    const newSubtaskInput = this.modalOverlay.querySelector('#newSubtaskTitle');

    const handleAddSubtask = () => {
      const title = newSubtaskInput.value.trim();
      if (!title) return;
      this.subtasksList.push({
        id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title,
        completed: false
      });
      newSubtaskInput.value = '';
      this.renderSubtasksList();
      newSubtaskInput.focus();
    };

    if (addSubtaskBtn && newSubtaskInput) {
      addSubtaskBtn.addEventListener('click', handleAddSubtask);
      newSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddSubtask();
        }
      });
    }

    const form = this.modalOverlay.querySelector('#taskForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = this.modalOverlay.querySelector('#taskTitleInput').value.trim();
        const description = this.modalOverlay.querySelector('#taskDescInput').value.trim();
        const status = this.modalOverlay.querySelector('#taskStatusSelect').value;
        const priority = this.modalOverlay.querySelector('#taskPrioritySelect').value;
        const category = this.modalOverlay.querySelector('#taskCategorySelect').value;
        const assigneeId = this.modalOverlay.querySelector('#taskAssigneeSelect').value || null;
        const dueDate = this.modalOverlay.querySelector('#taskDueDateInput').value || null;
        const estimatedHours = parseFloat(this.modalOverlay.querySelector('#taskHoursInput').value) || 0;
        const tagsRaw = this.modalOverlay.querySelector('#taskTagsInput').value;
        const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

        const payload = {
          title,
          description,
          status,
          priority,
          category,
          assigneeId,
          dueDate,
          estimatedHours,
          tags,
          subtasks: this.subtasksList
        };

        try {
          if (this.editingTaskId) {
            const res = await window.Api.updateTask(this.editingTaskId, payload);
            window.appState.upsertTask(res.task);
            window.Toast.success('Task Updated', `Changes saved to "${res.task.title}"`);
          } else {
            const res = await window.Api.createTask(payload);
            window.appState.upsertTask(res.task);
            window.Toast.success('Task Created', `Added "${res.task.title}"`);
          }
          this.close();
        } catch (err) {
          window.Toast.error('Operation Failed', err.message);
        }
      });
    }
  }
}

window.taskModal = new TaskModalComponent();
