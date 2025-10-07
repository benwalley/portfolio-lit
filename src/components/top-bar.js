import { LitElement, html, css } from 'lit';
import { ContextConsumer } from '@lit/context';
import { appStateContext } from '../context/app-state.js';

/**
 * TopBar Component
 * Displays system menu, time, date, and theme controls
 */
export class TopBar extends LitElement {
  static properties = {
    _currentTime: { state: true },
    _showThemeMenu: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      height: var(--topbar-height);
      background: var(--window-titlebar);
      border-bottom: 1px solid var(--color-border);
      z-index: var(--z-topbar);
      user-select: none;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 var(--spacing-sm);
      gap: var(--spacing-md);
    }

    .topbar-left,
    .topbar-center,
    .topbar-right {
      display: flex;
      position: relative;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .topbar-center {
      flex: 1;
      justify-content: center;
    }

    .logo {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      padding: 0 var(--spacing-sm);
    }

    .menu-item {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      background: none;
      border: none;
    }

    .menu-item:hover {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
    }

    .time-display {
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      font-variant-numeric: tabular-nums;
      min-width: 80px;
      text-align: right;
    }

    .theme-button {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      position: relative;
    }

    .theme-button:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-border-focus);
    }

    .theme-menu {
      position: absolute;
      top: calc(100% + var(--spacing-xs));
      right: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: var(--spacing-xs);
      min-width: 150px;
      z-index: 1000;
    }

    .theme-option {
      padding: var(--spacing-sm);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      transition: background var(--transition-fast);
    }

    .theme-option:hover {
      background: var(--color-surface-hover);
    }

    .theme-option.active {
      background: var(--color-primary);
      color: white;
    }

    .theme-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid currentColor;
    }

    .theme-indicator.dark { background: #1a1a1a; }
    .theme-indicator.light { background: #f5f5f5; }
    .theme-indicator.macos { background: linear-gradient(135deg, #ececec 0%, #f6f6f6 100%); }
    .theme-indicator.glass { background: linear-gradient(135deg, rgba(40,40,40,0.6) 0%, rgba(60,60,60,0.8) 100%); }

    @media (max-width: 768px) {
      .topbar-center {
        display: none;
      }

      .logo {
        font-size: var(--font-size-xs);
      }

      .time-display {
        font-size: var(--font-size-xs);
        min-width: 60px;
      }
    }
  `;

  constructor() {
    super();
    this._currentTime = new Date();
    this._showThemeMenu = false;
    this._timeInterval = null;

    // Consume context
    new ContextConsumer(
      this,
      { context: appStateContext, callback: (value) => {
        this.appState = value;
        this.requestUpdate();
      }, subscribe: true }
    );
  }

  connectedCallback() {
    super.connectedCallback();

    // Update time every second
    this._timeInterval = setInterval(() => {
      this._currentTime = new Date();
    }, 1000);

    // Close theme menu when clicking outside
    this._handleDocumentClick = (e) => {
      if (this._showThemeMenu && !e.composedPath().includes(this)) {
        this._showThemeMenu = false;
      }
    };
    document.addEventListener('click', this._handleDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this._timeInterval) {
      clearInterval(this._timeInterval);
    }

    document.removeEventListener('click', this._handleDocumentClick);
  }

  _formatTime() {
    const hours = this._currentTime.getHours();
    const minutes = this._currentTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  _formatDate() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = days[this._currentTime.getDay()];
    const month = months[this._currentTime.getMonth()];
    const date = this._currentTime.getDate();

    return `${day}, ${month} ${date}`;
  }

  _toggleThemeMenu(e) {
    e.stopPropagation();
    this._showThemeMenu = !this._showThemeMenu;
  }

  _selectTheme(theme) {
    if (!this.appState) return;
    this.appState.setTheme(theme);
    this._showThemeMenu = false;
  }

  _handleThemeOptionKeydown(e, theme) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._selectTheme(theme);
    } else if (e.key === 'Escape') {
      this._showThemeMenu = false;
    }
  }

  _handleThemeButtonKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._toggleThemeMenu(e);
    }
  }

  _getThemeIcon() {
    const theme = this.appState.getState().theme;
    const icons = {
      dark: '🌙',
      light: '☀️',
      macos: '🍎',
      glass: '✨'
    };
    return icons[theme] || '🎨';
  }

  render() {
    if (!this.appState) return html``;
    const state = this.appState.getState();
    const focusedWindow = this.appState.getFocusedWindow();

    return html`
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo">Portfolio OS</div>

          ${focusedWindow ? html`
            <span class="menu-item">${focusedWindow.title}</span>
          ` : ''}
        </div>

        <div class="topbar-center">
          <span class="menu-item text-secondary">${this._formatDate()}</span>
        </div>

        <div class="topbar-right">
          <div class="time-display">
            ${this._formatTime()}
          </div>

          <button
            class="theme-button"
            @click=${this._toggleThemeMenu}
            @keydown=${this._handleThemeButtonKeydown}
            aria-label="Select theme"
            aria-expanded="${this._showThemeMenu}"
            aria-haspopup="menu"
            title="Select theme"
          >
            ${this._getThemeIcon()}
          </button>

          ${this._showThemeMenu ? html`
            <div class="theme-menu" role="menu" aria-label="Theme selection">
              ${[
                { id: 'dark', name: 'Dark', icon: 'dark' },
                { id: 'light', name: 'Light', icon: 'light' },
                { id: 'macos', name: 'macOS', icon: 'macos' },
                { id: 'glass', name: 'Glass', icon: 'glass' }
              ].map(theme => html`
                <div
                  class="theme-option ${state.theme === theme.id ? 'active' : ''}"
                  @click=${() => this._selectTheme(theme.id)}
                  @keydown=${(e) => this._handleThemeOptionKeydown(e, theme.id)}
                  role="menuitem"
                  tabindex="0"
                  aria-current="${state.theme === theme.id ? 'true' : 'false'}"
                >
                  <div class="theme-indicator ${theme.icon}"></div>
                  ${theme.name}
                </div>
              `)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('top-bar', TopBar);
