import { LitElement, html, css } from 'lit';
import { ContextConsumer } from '@lit/context';
import { appStateContext } from '../context/app-state.js';
import {
  constrainPosition,
  snapToEdge,
  calculateResize,
  constrainSize,
  getAvailableDesktopBounds
} from '../utils/window-manager.js';
import {
  TOPBAR_HEIGHT,
  APPBAR_HEIGHT,
  WINDOW_MIN_WIDTH,
  WINDOW_MIN_HEIGHT
} from '../utils/constants.js';
import {
  getMinimizeKeyframes,
  getRestoreKeyframes,
  getMinimizeAnimationOptions,
  getRestoreAnimationOptions
} from '../utils/animations.js';
import './window-titlebar.js';

/**
 * OSWindow Component
 * Draggable and resizable window container
 */
export class OSWindow extends LitElement {
  static properties = {
    windowData: { type: Object },
    _isDragging: { state: true },
    _isResizing: { state: true },
    _dragStart: { state: true },
    _resizeHandle: { state: true },
    _isAnimating: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      position: absolute;
      will-change: transform;
    }

    :host([hidden]) {
      display: none;
    }

    .window {
      width: 100%;
      height: 100%;
      background: var(--window-background);
      border: 1px solid var(--window-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-window);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: box-shadow var(--transition-fast);
      backdrop-filter: blur(var(--backdrop-blur, 0)) saturate(var(--backdrop-saturate, 100%));
      -webkit-backdrop-filter: blur(var(--backdrop-blur, 0)) saturate(var(--backdrop-saturate, 100%));
    }

    .window.focused {
      box-shadow: var(--shadow-xl), 0 0 0 1px var(--color-primary);
    }

    .window.dragging {
      cursor: grabbing;
      box-shadow: var(--shadow-xl), 0 0 0 2px var(--color-primary);
    }

    .window.maximized {
      border-radius: 0;
    }

    .window-content {
      flex: 1;
      overflow: auto;
      position: relative;
    }

    .resize-handle {
      position: absolute;
      z-index: 10;
    }

    .resize-handle.n {
      top: 0;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: n-resize;
    }

    .resize-handle.s {
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: s-resize;
    }

    .resize-handle.e {
      right: 0;
      top: 8px;
      bottom: 8px;
      width: 8px;
      cursor: e-resize;
    }

    .resize-handle.w {
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 8px;
      cursor: w-resize;
    }

    .resize-handle.ne {
      top: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: ne-resize;
    }

    .resize-handle.nw {
      top: 0;
      left: 0;
      width: 16px;
      height: 16px;
      cursor: nw-resize;
    }

    .resize-handle.se {
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
    }

    .resize-handle.sw {
      bottom: 0;
      left: 0;
      width: 16px;
      height: 16px;
      cursor: sw-resize;
    }

    /* Hide resize handles when maximized */
    .window.maximized .resize-handle {
      display: none;
    }

    @media (max-width: 768px) {
      .window {
        border-radius: var(--radius-md);
      }
    }
  `;

  constructor() {
    super();
    this._isDragging = false;
    this._isResizing = false;
    this._dragStart = null;
    this._resizeHandle = null;
    this._originalWindow = null;
    this._isAnimating = false;
    this._currentAnimation = null;
    this._previousMinimizedState = false;

    // Consume context
    new ContextConsumer(
      this,
      { context: appStateContext, callback: (value) => {
        this.appState = value;
      }}
    );
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('windowData')) {
      const oldData = changedProperties.get('windowData');
      const newData = this.windowData;

      // Check if this is a newly opened window
      if (!oldData && newData?._isNewlyOpened) {
        // Animate in for newly opened windows
        this._animateRestore();
        // Clear the newly opened flag
        if (newData._isNewlyOpened) {
          delete newData._isNewlyOpened;
        }
        return;
      }

      // Check if minimize state changed
      const wasMinimized = oldData?.isMinimized;
      const isNowMinimized = newData?.isMinimized;

      if (wasMinimized !== isNowMinimized) {
        // Minimize state changed - trigger animation
        if (isNowMinimized) {
          this._animateMinimize();
        } else if (wasMinimized && !isNowMinimized) {
          this._animateRestore();
        }
      } else {
        // Other property changed (position, size, etc) - update position
        this._updatePosition();
      }
    }
  }

  _updatePosition() {
    if (!this.windowData) return;

    const { position, size, zIndex } = this.windowData;

    this.style.left = `${position.x}px`;
    this.style.top = `${position.y}px`;
    this.style.width = `${size.width}px`;
    this.style.height = `${size.height}px`;
    this.style.zIndex = zIndex || 100;

    // Hide if minimized
    if (this.windowData.isMinimized) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }
  }

  /**
   * Animate window minimize - scale down in place
   */
  _animateMinimize() {
    if (!this.windowData) return;

    // Cancel any existing animation
    if (this._currentAnimation) {
      this._currentAnimation.cancel();
    }

    this._isAnimating = true;

    // Get window element
    const windowElement = this.shadowRoot.querySelector('.window');
    if (!windowElement) return;

    // Scale down in place
    const keyframes = getMinimizeKeyframes();
    const options = getMinimizeAnimationOptions();

    // Start animation
    this._currentAnimation = windowElement.animate(keyframes, options);

    // When animation completes, update visibility
    this._currentAnimation.onfinish = () => {
      this._isAnimating = false;
      this._currentAnimation = null;
      this._updatePosition(); // This will hide the window
    };
  }

  /**
   * Animate window restore - scale up in place
   */
  _animateRestore() {
    if (!this.windowData) return;

    // Cancel any existing animation
    if (this._currentAnimation) {
      this._currentAnimation.cancel();
    }

    this._isAnimating = true;

    // Get window element
    const windowElement = this.shadowRoot.querySelector('.window');
    if (!windowElement) return;

    // Make sure window is visible before animating
    this.removeAttribute('hidden');

    // Scale up in place
    const keyframes = getRestoreKeyframes();
    const options = getRestoreAnimationOptions();

    // Start animation
    this._currentAnimation = windowElement.animate(keyframes, options);

    // When animation completes
    this._currentAnimation.onfinish = () => {
      this._isAnimating = false;
      this._currentAnimation = null;
      // Clear the animation transform
      windowElement.style.transform = '';
      windowElement.style.opacity = '';
    };
  }

  _handleFocus() {
    if (!this.windowData.isFocused) {
      this.dispatchEvent(new CustomEvent('focus', {
        bubbles: true,
        composed: true
      }));
    }
  }

  _handleDragStart(e) {

    this._handleFocus();
    this._isDragging = true;

    // Extract the original event from custom event
    const originalEvent = e.detail?.originalEvent || e;
    const clientX = originalEvent.clientX || originalEvent.touches?.[0]?.clientX;
    const clientY = originalEvent.clientY || originalEvent.touches?.[0]?.clientY;

    this._dragStart = {
      x: clientX,
      y: clientY,
      windowX: this.windowData.position.x,
      windowY: this.windowData.position.y
    };

    document.addEventListener('mousemove', this._boundHandleDrag);
    document.addEventListener('mouseup', this._boundHandleDragEnd);
    document.addEventListener('touchmove', this._boundHandleDrag);
    document.addEventListener('touchend', this._boundHandleDragEnd);

    originalEvent.preventDefault?.();
  }

  _handleDrag(e) {
    if (!this._isDragging || !this.appState) return;

    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;

    const deltaX = clientX - this._dragStart.x;
    const deltaY = clientY - this._dragStart.y;

    let newX = this._dragStart.windowX + deltaX;
    let newY = this._dragStart.windowY + deltaY;

    // Constrain to desktop bounds
    const desktopSize = this.appState.getState().desktopSize;
    const availableBounds = getAvailableDesktopBounds(desktopSize);

    const constrained = constrainPosition(
      { x: newX, y: newY },
      this.windowData.size,
      availableBounds
    );

    // Optional: Snap to edges
    const snapped = snapToEdge(
      constrained,
      this.windowData.size,
      availableBounds
    );

    this.appState.updateWindowPosition(this.windowData.id, snapped);
  }

  _handleDragEnd() {
    this._isDragging = false;
    this._dragStart = null;

    document.removeEventListener('mousemove', this._boundHandleDrag);
    document.removeEventListener('mouseup', this._boundHandleDragEnd);
    document.removeEventListener('touchmove', this._boundHandleDrag);
    document.removeEventListener('touchend', this._boundHandleDragEnd);
  }

  _handleResizeStart(e, handle) {

    this._handleFocus();
    this._isResizing = true;
    this._resizeHandle = handle;
    this._dragStart = {
      x: e.clientX,
      y: e.clientY
    };
    this._originalWindow = {
      position: { ...this.windowData.position },
      size: { ...this.windowData.size }
    };

    document.addEventListener('mousemove', this._boundHandleResize);
    document.addEventListener('mouseup', this._boundHandleResizeEnd);

    e.preventDefault();
    e.stopPropagation();
  }

  _handleResize(e) {
    if (!this._isResizing || !this.appState) return;

    const currentPos = { x: e.clientX, y: e.clientY };

    const { position, size } = calculateResize(
      this._resizeHandle,
      this._dragStart,
      currentPos,
      this._originalWindow,
      { width: WINDOW_MIN_WIDTH, height: WINDOW_MIN_HEIGHT }
    );

    // Constrain to desktop bounds
    const desktopSize = this.appState.getState().desktopSize;
    const availableBounds = getAvailableDesktopBounds(desktopSize);

    const constrainedSize = constrainSize(
      size,
      { width: WINDOW_MIN_WIDTH, height: WINDOW_MIN_HEIGHT },
      availableBounds
    );
    const constrainedPos = constrainPosition(position, constrainedSize, availableBounds);

    this.appState.updateWindowPosition(this.windowData.id, constrainedPos);
    this.appState.updateWindowSize(this.windowData.id, constrainedSize);
  }

  _handleResizeEnd() {
    this._isResizing = false;
    this._resizeHandle = null;
    this._originalWindow = null;

    document.removeEventListener('mousemove', this._boundHandleResize);
    document.removeEventListener('mouseup', this._boundHandleResizeEnd);
  }

  connectedCallback() {
    super.connectedCallback();

    // Bind methods for event listeners
    this._boundHandleDrag = this._handleDrag.bind(this);
    this._boundHandleDragEnd = this._handleDragEnd.bind(this);
    this._boundHandleResize = this._handleResize.bind(this);
    this._boundHandleResizeEnd = this._handleResizeEnd.bind(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up event listeners
    if (this._isDragging) {
      this._handleDragEnd();
    }
    if (this._isResizing) {
      this._handleResizeEnd();
    }

    // Extra safety: remove all possible event listeners
    document.removeEventListener('mousemove', this._boundHandleDrag);
    document.removeEventListener('mouseup', this._boundHandleDragEnd);
    document.removeEventListener('touchmove', this._boundHandleDrag);
    document.removeEventListener('touchend', this._boundHandleDragEnd);
    document.removeEventListener('mousemove', this._boundHandleResize);
    document.removeEventListener('mouseup', this._boundHandleResizeEnd);
  }

  _renderAppContent() {
    const component = this.windowData?.component || 'default';

    switch (component) {
      case 'about-app':
        return this._renderAboutApp();
      case 'terminal-app':
        return this._renderTerminalApp();
      case 'projects-app':
        return this._renderProjectsApp();
      case 'contact-app':
        return this._renderContactApp();
      case 'settings-app':
        return this._renderSettingsApp();
      case 'files-app':
        return this._renderFilesApp();
      default:
        return this._renderDefaultContent();
    }
  }

  _renderAboutApp() {
    return html`
      <div style="padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); height: 100%; overflow-y: auto;">
        <div style="display: flex; align-items: center; gap: var(--spacing-lg);">
          <div style="font-size: 64px;">👤</div>
          <div>
            <h2 style="margin: 0;">Ben Walley</h2>
            <p style="margin: var(--spacing-xs) 0 0 0; color: var(--color-text-secondary);">Full Stack Developer</p>
          </div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: var(--spacing-md);">
          <section>
            <h3 style="margin: 0 0 var(--spacing-sm) 0;">About</h3>
            <p style="line-height: 1.6;">
              Welcome to my interactive portfolio! This OS-style interface showcases my work and skills
              in a unique and engaging way. Feel free to explore the different applications.
            </p>
          </section>

          <section>
            <h3 style="margin: 0 0 var(--spacing-sm) 0;">Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs);">
              ${['JavaScript', 'TypeScript', 'React', 'Node.js', 'Lit', 'CSS', 'HTML', 'Git'].map(skill => html`
                <span style="background: var(--color-surface); padding: var(--spacing-xs) var(--spacing-sm);
                             border-radius: var(--radius-sm); font-size: var(--font-size-sm);">
                  ${skill}
                </span>
              `)}
            </div>
          </section>

          <section>
            <h3 style="margin: 0 0 var(--spacing-sm) 0;">Experience</h3>
            <p style="line-height: 1.6; color: var(--color-text-secondary);">
              Building modern web applications with focus on user experience and clean architecture.
            </p>
          </section>
        </div>
      </div>
    `;
  }

  _renderTerminalApp() {
    return html`
      <div style="padding: var(--spacing-md); height: 100%; background: #1e1e1e; font-family: 'Monaco', 'Courier New', monospace;">
        <div style="color: #00ff00; font-size: var(--font-size-sm);">
          <p style="margin: 0;">Portfolio OS Terminal v1.0.0</p>
          <p style="margin: var(--spacing-xs) 0;">Type 'help' for available commands.</p>
          <br>
          <p style="margin: 0; color: #888;">$ <span style="animation: blink 1s infinite;">_</span></p>
        </div>
        <p style="margin-top: var(--spacing-lg); color: #666; font-size: var(--font-size-sm);">
          Terminal functionality coming soon...
        </p>
      </div>
      <style>
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      </style>
    `;
  }

  _renderProjectsApp() {
    return html`
      <div style="padding: var(--spacing-lg); height: 100%; overflow-y: auto;">
        <h2 style="margin: 0 0 var(--spacing-md) 0;">Projects</h2>
        <div style="display: grid; gap: var(--spacing-md);">
          ${[
            { name: 'Portfolio OS', desc: 'Interactive desktop-style portfolio built with Lit', emoji: '🖥️' },
            { name: 'Web App Dashboard', desc: 'Modern analytics dashboard with real-time data', emoji: '📊' },
            { name: 'E-commerce Platform', desc: 'Full-stack shopping experience with payment integration', emoji: '🛒' }
          ].map(project => html`
            <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md);
                        padding: var(--spacing-md); background: var(--color-surface);">
              <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                <div style="font-size: 32px;">${project.emoji}</div>
                <div style="flex: 1;">
                  <h3 style="margin: 0; font-size: var(--font-size-md);">${project.name}</h3>
                  <p style="margin: var(--spacing-xs) 0 0 0; color: var(--color-text-secondary);
                            font-size: var(--font-size-sm);">${project.desc}</p>
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  _renderContactApp() {
    return html`
      <div style="padding: var(--spacing-lg); height: 100%; overflow-y: auto;">
        <h2 style="margin: 0 0 var(--spacing-md) 0;">Get in Touch</h2>
        <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
          <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            <a href="mailto:ben@example.com" style="display: flex; align-items: center; gap: var(--spacing-sm);
                                                     padding: var(--spacing-md); background: var(--color-surface);
                                                     border-radius: var(--radius-md); text-decoration: none;
                                                     color: var(--color-text-primary); transition: all var(--transition-fast);">
              <span style="font-size: 24px;">📧</span>
              <div>
                <div style="font-weight: var(--font-weight-medium);">Email</div>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">ben@example.com</div>
              </div>
            </a>

            <a href="https://github.com" target="_blank" style="display: flex; align-items: center; gap: var(--spacing-sm);
                                                                  padding: var(--spacing-md); background: var(--color-surface);
                                                                  border-radius: var(--radius-md); text-decoration: none;
                                                                  color: var(--color-text-primary);">
              <span style="font-size: 24px;">💻</span>
              <div>
                <div style="font-weight: var(--font-weight-medium);">GitHub</div>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">github.com/benwalley</div>
              </div>
            </a>

            <a href="https://linkedin.com" target="_blank" style="display: flex; align-items: center; gap: var(--spacing-sm);
                                                                    padding: var(--spacing-md); background: var(--color-surface);
                                                                    border-radius: var(--radius-md); text-decoration: none;
                                                                    color: var(--color-text-primary);">
              <span style="font-size: 24px;">💼</span>
              <div>
                <div style="font-weight: var(--font-weight-medium);">LinkedIn</div>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">linkedin.com/in/benwalley</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  _renderSettingsApp() {
    return html`
      <div style="padding: var(--spacing-lg); height: 100%; overflow-y: auto;">
        <h2 style="margin: 0 0 var(--spacing-md) 0;">Settings</h2>
        <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
          <section>
            <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-md);">Appearance</h3>
            <p style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
              Change theme using the theme switcher in the top bar
            </p>
          </section>

          <section>
            <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-md);">Desktop</h3>
            <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
              Drag icons to customize your desktop layout. Positions are saved automatically.
            </p>
          </section>

          <section>
            <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-md);">Keyboard Shortcuts</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-xs); font-size: var(--font-size-sm);">
              <div style="display: flex; justify-content: space-between;">
                <span>Close Window</span>
                <code style="background: var(--color-surface); padding: 2px 6px; border-radius: var(--radius-sm);">Cmd/Ctrl + Q</code>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Minimize Window</span>
                <code style="background: var(--color-surface); padding: 2px 6px; border-radius: var(--radius-sm);">Cmd/Ctrl + M</code>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Maximize Window</span>
                <code style="background: var(--color-surface); padding: 2px 6px; border-radius: var(--radius-sm);">Cmd/Ctrl + F</code>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  _renderFilesApp() {
    return html`
      <div style="padding: var(--spacing-lg); height: 100%; overflow-y: auto;">
        <h2 style="margin: 0 0 var(--spacing-md) 0;">Files</h2>
        <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden;">
          <div style="background: var(--color-surface); padding: var(--spacing-sm) var(--spacing-md);
                      border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm);
                      font-weight: var(--font-weight-medium);">
            ~/Desktop
          </div>
          <div style="padding: var(--spacing-md);">
            ${[
              { name: 'Documents', icon: '📄', type: 'folder' },
              { name: 'Images', icon: '🖼️', type: 'folder' },
              { name: 'Projects', icon: '📁', type: 'folder' },
              { name: 'README.md', icon: '📝', type: 'file' }
            ].map(item => html`
              <div style="display: flex; align-items: center; gap: var(--spacing-sm);
                          padding: var(--spacing-sm); border-radius: var(--radius-sm);
                          cursor: pointer; transition: background var(--transition-fast);"
                   @mouseenter=${(e) => e.target.style.background = 'var(--color-surface-hover)'}
                   @mouseleave=${(e) => e.target.style.background = 'transparent'}>
                <span style="font-size: 20px;">${item.icon}</span>
                <span style="font-size: var(--font-size-sm);">${item.name}</span>
              </div>
            `)}
          </div>
        </div>
        <p style="margin-top: var(--spacing-lg); color: var(--color-text-secondary); font-size: var(--font-size-sm);">
          File browser functionality coming soon...
        </p>
      </div>
    `;
  }

  _renderDefaultContent() {
    return html`
      <div style="padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); height: 100%;">
        <h2>Welcome to Portfolio OS!</h2>
        <p>This is a demo window showing the OS-style interface.</p>
        <p>Try the following:</p>
        <ul style="padding-left: var(--spacing-lg); line-height: 1.8;">
          <li>Drag the window by the title bar</li>
          <li>Resize from the edges and corners</li>
          <li>Click the traffic lights to minimize/maximize/close</li>
          <li>Try keyboard shortcuts:
            <ul style="padding-left: var(--spacing-lg); margin-top: var(--spacing-xs);">
              <li><strong>Cmd/Ctrl + Q</strong> - Close window</li>
              <li><strong>Cmd/Ctrl + M</strong> - Minimize</li>
              <li><strong>Cmd/Ctrl + F</strong> - Maximize/Restore</li>
            </ul>
          </li>
          <li>Switch themes using the button in the top-right corner</li>
        </ul>
        <p style="margin-top: auto; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
          More features coming soon...
        </p>
      </div>
    `;
  }

  render() {
    if (!this.windowData) return null;

    const { title, isFocused } = this.windowData;

    return html`
      <div
        class="window ${isFocused ? 'focused' : ''} ${this._isDragging ? 'dragging' : ''}"
        @mousedown=${this._handleFocus}
      >
        <window-titlebar
          .title=${title}
          @dragstart=${this._handleDragStart}
          @close=${() => this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }))}
          @minimize=${() => this.dispatchEvent(new CustomEvent('minimize', { bubbles: true, composed: true }))}
          @center=${() => this.dispatchEvent(new CustomEvent('center', { bubbles: true, composed: true }))}
          @maximize=${() => this.dispatchEvent(new CustomEvent('maximize', { bubbles: true, composed: true }))}
        ></window-titlebar>

        <div class="window-content">
          <slot>
            ${this._renderAppContent()}
          </slot>
        </div>

        <div class="resize-handle n" @mousedown=${(e) => this._handleResizeStart(e, 'n')} role="separator" aria-label="Resize north" aria-orientation="horizontal"></div>
        <div class="resize-handle s" @mousedown=${(e) => this._handleResizeStart(e, 's')} role="separator" aria-label="Resize south" aria-orientation="horizontal"></div>
        <div class="resize-handle e" @mousedown=${(e) => this._handleResizeStart(e, 'e')} role="separator" aria-label="Resize east" aria-orientation="vertical"></div>
        <div class="resize-handle w" @mousedown=${(e) => this._handleResizeStart(e, 'w')} role="separator" aria-label="Resize west" aria-orientation="vertical"></div>
        <div class="resize-handle ne" @mousedown=${(e) => this._handleResizeStart(e, 'ne')} role="separator" aria-label="Resize northeast"></div>
        <div class="resize-handle nw" @mousedown=${(e) => this._handleResizeStart(e, 'nw')} role="separator" aria-label="Resize northwest"></div>
        <div class="resize-handle se" @mousedown=${(e) => this._handleResizeStart(e, 'se')} role="separator" aria-label="Resize southeast"></div>
        <div class="resize-handle sw" @mousedown=${(e) => this._handleResizeStart(e, 'sw')} role="separator" aria-label="Resize southwest"></div>
      </div>
    `;
  }
}

customElements.define('os-window', OSWindow);
