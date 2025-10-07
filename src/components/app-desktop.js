import { LitElement, html, css } from 'lit';
import { ContextProvider } from '@lit/context';
import { appStateContext, appState } from '../context/app-state.js';
import './top-bar.js';
import './app-bar.js';
import './os-window.js';
import './desktop-icons-grid.js';

/**
 * AppDesktop Component
 * Root component that manages the desktop environment
 */
export class AppDesktop extends LitElement {
  static properties = {
    _state: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: var(--color-background);
    }

    .desktop {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .desktop-content {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .desktop-background {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-alt) 100%);
      z-index: var(--z-desktop);
    }

    .icons-layer {
      position: absolute;
      inset: 0;
      z-index: calc(var(--z-desktop) + 1);
    }

    .windows-container {
      position: absolute;
      inset: 0;
      z-index: calc(var(--z-desktop) + 10);
      pointer-events: none;
    }

    .windows-container os-window {
      pointer-events: auto;
    }

    /* Keyboard shortcuts info (hidden by default) */
    .shortcuts-info {
      position: absolute;
      bottom: var(--spacing-md);
      left: var(--spacing-md);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      font-size: var(--font-size-sm);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition-base);
      z-index: 1000;
    }

    .shortcuts-info.visible {
      opacity: 1;
      pointer-events: auto;
    }
  `;

  constructor() {
    super();
    this._state = appState.getState();
    this._unsubscribe = null;

    // Provide context to child components
    new ContextProvider(this, { context: appStateContext, initialValue: appState });

    // Create debounced handler in constructor to avoid recreation
    this._handleResize = this._createDebouncedResizeHandler();
    this._handleKeydown = this._onKeyDown.bind(this);
    this._handleDesktopClick = this._onDesktopClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Subscribe to state changes
    this._unsubscribe = appState.subscribe((state) => {
      this._state = state;
      this.requestUpdate();
    });

    window.addEventListener('resize', this._handleResize);
    window.addEventListener('keydown', this._handleKeydown);

    // Initialize desktop size
    appState.updateDesktopSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Note: Demo window removed - users can now launch apps via desktop icons
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this._unsubscribe) {
      this._unsubscribe();
    }

    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('keydown', this._handleKeydown);
  }

  /**
   * Handle keyboard shortcuts
   */
  _onKeyDown(e) {
    // More reliable platform detection
    const isMac = navigator.userAgentData?.platform === 'macOS' ||
                  navigator.platform.includes('Mac') ||
                  /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (!modifier) return;

    const focusedWindow = appState.getFocusedWindow();

    switch(e.key.toLowerCase()) {
      case 'q':
        // Close focused window
        if (focusedWindow) {
          e.preventDefault();
          appState.closeWindow(focusedWindow.id);
        }
        break;

      case 'm':
        // Minimize focused window
        if (focusedWindow) {
          e.preventDefault();
          appState.minimizeWindow(focusedWindow.id);
        }
        break;

      case 'c':
        // Center focused window
        if (focusedWindow) {
          e.preventDefault();
          appState.centerWindow(focusedWindow.id);
        }
        break;

      case 'f':
        // Maximize/restore focused window
        if (focusedWindow && !e.shiftKey) {
          e.preventDefault();
          appState.maximizeWindow(focusedWindow.id);
        }
        break;

      case 't':
        // Open terminal (will implement later)
        e.preventDefault();
        this._openTerminal();
        break;

      case 'tab':
        // Cycle through windows
        if (this._state.windows.length > 1) {
          e.preventDefault();
          this._cycleWindows();
        }
        break;
    }
  }

  /**
   * Cycle through open windows
   */
  _cycleWindows() {
    const windows = [...this._state.windows].sort((a, b) => b.zIndex - a.zIndex);
    if (windows.length < 2) return;

    const currentIndex = windows.findIndex(w => w.isFocused);
    const nextIndex = (currentIndex + 1) % windows.length;
    appState.focusWindow(windows[nextIndex].id);
  }

  /**
   * Open terminal window (placeholder for now)
   */
  _openTerminal() {
    // Will implement once we have the terminal component
    console.log('Opening terminal...');
  }

  /**
   * Handle clicking on the desktop background
   * Minimizes all windows
   */
  _onDesktopClick(e) {
    // Check if click is on the desktop content area (not on a window or icon)
    const target = e.target;
    const clickedOnWindow = target.closest('os-window');
    const clickedOnIcon = target.closest('desktop-icon');

    // Only minimize if not clicking on windows or icons
    if (!clickedOnWindow && !clickedOnIcon) {
      this._state.windows.forEach(windowData => {
        if (!windowData.isMinimized) {
          appState.minimizeWindow(windowData.id);
        }
      });
    }
  }

  /**
   * Create debounced resize handler (called once in constructor)
   */
  _createDebouncedResizeHandler() {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        appState.updateDesktopSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 250);
    };
  }

  render() {
    return html`
      <div class="desktop">
        <top-bar></top-bar>

        <div class="desktop-content" @click=${this._handleDesktopClick}>
          <div class="desktop-background"></div>

          <div class="icons-layer">
            <desktop-icons-grid></desktop-icons-grid>
          </div>

          <div class="windows-container">
            ${this._state.windows.map(windowData => html`
              <os-window
                .windowData=${windowData}
                @close=${() => appState.closeWindow(windowData.id)}
                @focus=${() => appState.focusWindow(windowData.id)}
                @minimize=${() => appState.minimizeWindow(windowData.id)}
                @center=${() => appState.centerWindow(windowData.id)}
                @maximize=${() => appState.maximizeWindow(windowData.id)}
              ></os-window>
            `)}
          </div>
        </div>

        <app-bar></app-bar>
      </div>
    `;
  }
}

customElements.define('app-desktop', AppDesktop);
