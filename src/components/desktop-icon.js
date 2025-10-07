import { LitElement, html, css } from 'lit';
import { ICON_SIZE } from '../utils/constants.js';

/**
 * DesktopIcon Component
 * Individual draggable desktop application icon
 */
export class DesktopIcon extends LitElement {
  static properties = {
    appData: { type: Object },
    position: { type: Object },
    selected: { type: Boolean },
    dragging: { type: Boolean, state: true }
  };

  static styles = css`
    :host {
      display: block;
      position: absolute;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      width: ${ICON_SIZE}px;
      transition: transform var(--transition-fast), opacity var(--transition-fast);
      animation: iconFadeIn var(--transition-base) ease-out;
    }

    @keyframes iconFadeIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes iconBounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    :host(:hover) {
      /* Removed transform for simpler color-only hover effect */
    }

    :host([dragging]) {
      opacity: 0.7;
      cursor: grabbing;
      z-index: 1000;
      transition: none;
    }

    :host(.launching) .icon-wrapper {
      animation: iconBounce 0.4s ease-in-out;
    }

    .icon-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .icon-container:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    .icon-container.selected {
      background: rgba(var(--color-primary-rgb, 0, 102, 255), 0.2);
    }

    .icon-wrapper {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }

    .icon-container:hover .icon-wrapper {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .icon-container.selected .icon-wrapper {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary);
    }

    .icon-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      text-align: center;
      max-width: ${ICON_SIZE}px;
      word-wrap: break-word;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    /* Dragging ghost effect */
    :host([dragging]) .icon-container {
      pointer-events: none;
    }

    @media (max-width: 768px) {
      :host {
        width: 70px;
      }

      .icon-wrapper {
        width: 56px;
        height: 56px;
        font-size: 40px;
      }

      .icon-label {
        font-size: 10px;
        max-width: 70px;
      }
    }
  `;

  constructor() {
    super();
    this.appData = null;
    this.position = { x: 0, y: 0 };
    this.selected = false;
    this.dragging = false;

    this._dragStart = null;
    this._originalPosition = null;
    this._hasDragged = false;
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('position')) {
      this.style.left = `${this.position.x}px`;
      this.style.top = `${this.position.y}px`;
    }

    if (changedProperties.has('dragging')) {
      if (this.dragging) {
        this.setAttribute('dragging', '');
      } else {
        this.removeAttribute('dragging');
      }
    }
  }

  _launchApp() {
    // Add bounce animation
    this.classList.add('launching');
    setTimeout(() => {
      this.classList.remove('launching');
    }, 400);

    this.dispatchEvent(new CustomEvent('icon-launch', {
      bubbles: true,
      composed: true,
      detail: {
        appId: this.appData.id,
        appData: this.appData
      }
    }));
  }

  _handleMouseDown(e) {
    if (e.button !== 0) return; // Only left click

    this._hasDragged = false;
    this._dragStart = {
      x: e.clientX,
      y: e.clientY
    };
    this._originalPosition = { ...this.position };

    document.addEventListener('mousemove', this._boundHandleMouseMove);
    document.addEventListener('mouseup', this._boundHandleMouseUp);

    e.preventDefault();
    e.stopPropagation();
  }

  _handleMouseMove(e) {
    if (!this._dragStart) return;

    const deltaX = e.clientX - this._dragStart.x;
    const deltaY = e.clientY - this._dragStart.y;

    // Mark as dragged if moved more than 5 pixels
    if (!this._hasDragged && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      this._hasDragged = true;
      this.dragging = true;
    }

    // Only dispatch drag events if actually dragging
    if (this._hasDragged) {
      const newPosition = {
        x: this._originalPosition.x + deltaX,
        y: this._originalPosition.y + deltaY
      };

      this.dispatchEvent(new CustomEvent('icon-drag', {
        bubbles: true,
        composed: true,
        detail: {
          appId: this.appData.id,
          position: newPosition
        }
      }));
    }
  }

  _handleMouseUp(e) {
    if (!this._dragStart) return;

    const deltaX = e.clientX - this._dragStart.x;
    const deltaY = e.clientY - this._dragStart.y;

    // Clean up listeners first
    document.removeEventListener('mousemove', this._boundHandleMouseMove);
    document.removeEventListener('mouseup', this._boundHandleMouseUp);

    // If dragged, dispatch drop event
    if (this._hasDragged) {
      const newPosition = {
        x: this._originalPosition.x + deltaX,
        y: this._originalPosition.y + deltaY
      };

      this.dispatchEvent(new CustomEvent('icon-drop', {
        bubbles: true,
        composed: true,
        detail: {
          appId: this.appData.id,
          position: newPosition
        }
      }));

      this.dragging = false;
    } else {
      // If not dragged, launch app
      this._launchApp();
    }

    // Reset state
    this._dragStart = null;
    this._originalPosition = null;
    this._hasDragged = false;
  }

  _handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._launchApp(e);
    }
  }

  _handleClick(e) {
    // Stop click events from bubbling to desktop
    e.stopPropagation();
  }

  connectedCallback() {
    super.connectedCallback();
    this._boundHandleMouseMove = this._handleMouseMove.bind(this);
    this._boundHandleMouseUp = this._handleMouseUp.bind(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('mousemove', this._boundHandleMouseMove);
    document.removeEventListener('mouseup', this._boundHandleMouseUp);
  }

  render() {
    if (!this.appData) return html``;

    return html`
      <div
        class="icon-container ${this.selected ? 'selected' : ''}"
        tabindex="0"
        role="button"
        aria-label="${this.appData.description || `Launch ${this.appData.name}`}"
        @mousedown=${this._handleMouseDown}
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        <div class="icon-wrapper">
          ${this.appData.icon}
        </div>
        <div class="icon-label">${this.appData.name}</div>
      </div>
    `;
  }
}

customElements.define('desktop-icon', DesktopIcon);
