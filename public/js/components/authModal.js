// Authentication & Profile Modal Component

class AuthModalComponent {
  constructor() {
    this.modalOverlay = null;
    this.currentMode = 'login'; // 'login', 'register', 'demo'
    this.createDom();
  }

  createDom() {
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.className = 'modal-overlay';
    this.modalOverlay.id = 'authModalOverlay';
    document.body.appendChild(this.modalOverlay);

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });
  }

  open(showProfile = false) {
    const user = window.appState.get('currentUser');
    if (user && showProfile) {
      this.currentMode = 'profile';
    } else if (user) {
      this.currentMode = 'profile';
    } else {
      this.currentMode = 'login';
    }
    this.render();
    this.modalOverlay.classList.add('active');
  }

  close() {
    this.modalOverlay.classList.remove('active');
  }

  render() {
    const user = window.appState.get('currentUser');

    if (this.currentMode === 'profile' && user) {
      this.modalOverlay.innerHTML = `
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Active Profile
            </h3>
            <button class="btn-icon close-modal-btn" aria-label="Close modal">&times;</button>
          </div>
          <div class="modal-body" style="align-items: center; text-align: center; gap: 1rem;">
            <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" 
                 style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--accent-primary); box-shadow: var(--shadow-glow);" />
            <div>
              <h2 style="font-size: 1.25rem;">${window.Utils.escapeHTML(user.name)}</h2>
              <p style="color: var(--text-secondary); font-size: 0.85rem;">${window.Utils.escapeHTML(user.email)}</p>
              <span class="category-tag" style="margin-top: 0.5rem; display: inline-block;">${window.Utils.escapeHTML(user.role || 'Team Member')}</span>
            </div>

            <div style="width: 100%; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 0.5rem;">
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">Switch to another team profile:</p>
              <div id="demoPillsContainer" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
            <button class="btn btn-danger" id="logoutBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log Out
            </button>
            <button class="btn btn-secondary close-modal-btn">Done</button>
          </div>
        </div>
      `;
      this.populateDemoList();
      this.bindProfileEvents();
      return;
    }

    // Login or Register mode
    const isLogin = this.currentMode === 'login';

    this.modalOverlay.innerHTML = `
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            ${isLogin ? 'Sign In to TaskMaster' : 'Create New Account'}
          </h3>
          <button class="btn-icon close-modal-btn" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Fast Demo Switcher Bar -->
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: var(--radius-md); padding: 0.85rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.05em;">⚡ Instant 1-Click Demo Login</span>
            </div>
            <div id="demoPillsContainer" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem; margin: 0.25rem 0;">
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">or use credentials</span>
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          </div>

          <form id="authForm" style="display: flex; flex-direction: column; gap: 1rem;">
            ${!isLogin ? `
              <div class="form-group">
                <label class="form-label" for="authName">Full Name</label>
                <input class="form-control" type="text" id="authName" placeholder="e.g. Alex Rivera" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="authRole">Workspace Role</label>
                <input class="form-control" type="text" id="authRole" placeholder="e.g. Product Designer" />
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label" for="authEmail">Email Address</label>
              <input class="form-control" type="email" id="authEmail" placeholder="alex@taskmaster.io" required value="${isLogin ? 'alex@taskmaster.io' : ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="authPassword">Password</label>
              <input class="form-control" type="password" id="authPassword" placeholder="••••••••" required value="${isLogin ? 'password123' : ''}" />
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; width: 100%;">
              ${isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style="text-align: center; font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
            ${isLogin ? `
              Don't have an account? <a href="#" id="switchModeBtn" style="color: var(--accent-primary); font-weight: 600;">Sign up</a>
            ` : `
              Already have an account? <a href="#" id="switchModeBtn" style="color: var(--accent-primary); font-weight: 600;">Sign in</a>
            `}
          </div>
        </div>
      </div>
    `;

    this.populateDemoList();
    this.bindAuthEvents();
  }

  async populateDemoList() {
    const container = this.modalOverlay.querySelector('#demoPillsContainer');
    if (!container) return;

    try {
      const data = await window.Api.getDemoAccounts();
      const accounts = data.demoAccounts || [];

      container.innerHTML = accounts.map(acc => `
        <button class="btn btn-secondary demo-user-btn" data-user-id="${acc.id}" style="padding: 0.4rem 0.6rem; font-size: 0.775rem; justify-content: flex-start; gap: 0.5rem; text-align: left;">
          <img src="${acc.avatar}" style="width: 20px; height: 20px; border-radius: 50%;" />
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <strong>${acc.name.split(' ')[0]}</strong> (${acc.role.split(' ')[0]})
          </div>
        </button>
      `).join('');

      container.querySelectorAll('.demo-user-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const userId = e.currentTarget.dataset.userId;
          try {
            const res = await window.Api.loginDemo(userId);
            window.appState.setUser(res.user, res.token);
            window.Toast.success('Logged In', `Switched active user to ${res.user.name}`);
            this.close();
          } catch (err) {
            window.Toast.error('Login Failed', err.message);
          }
        });
      });
    } catch (err) {
      console.error('Could not load demo accounts:', err);
    }
  }

  bindAuthEvents() {
    this.modalOverlay.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    const switchBtn = this.modalOverlay.querySelector('#switchModeBtn');
    if (switchBtn) {
      switchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentMode = this.currentMode === 'login' ? 'register' : 'login';
        this.render();
      });
    }

    const form = this.modalOverlay.querySelector('#authForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = this.modalOverlay.querySelector('#authEmail').value;
        const password = this.modalOverlay.querySelector('#authPassword').value;

        try {
          if (this.currentMode === 'login') {
            const res = await window.Api.login({ email, password });
            window.appState.setUser(res.user, res.token);
            window.Toast.success('Welcome back', `Logged in as ${res.user.name}`);
          } else {
            const name = this.modalOverlay.querySelector('#authName').value;
            const role = this.modalOverlay.querySelector('#authRole').value;
            const res = await window.Api.register({ name, role, email, password });
            window.appState.setUser(res.user, res.token);
            window.Toast.success('Account Created', `Welcome to TaskMaster, ${res.user.name}!`);
          }
          this.close();
        } catch (err) {
          window.Toast.error('Auth Error', err.message);
        }
      });
    }
  }

  bindProfileEvents() {
    this.modalOverlay.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    const logoutBtn = this.modalOverlay.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.appState.setUser(null, null);
        window.Toast.info('Logged Out', 'You are now viewing as guest');
        this.close();
      });
    }
  }
}

window.authModal = new AuthModalComponent();
