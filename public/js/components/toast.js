// Toast Notification System

class ToastManager {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toastContainer';
    document.body.appendChild(this.container);
  }

  show(type, title, message, duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSvg = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${window.Utils.escapeHTML(title)}</div>
        ${message ? `<div class="toast-message">${window.Utils.escapeHTML(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    };

    closeBtn.addEventListener('click', dismiss);
    this.container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  success(title, message) { this.show('success', title, message); }
  info(title, message) { this.show('info', title, message); }
  warning(title, message) { this.show('warning', title, message); }
  error(title, message) { this.show('danger', title, message); }

  getIcon(type) {
    switch (type) {
      case 'success':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      case 'warning':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      case 'danger':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      case 'info':
      default:
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
  }
}

window.Toast = new ToastManager();
