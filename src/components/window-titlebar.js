import { LitElement, html, css } from 'lit';

/**
 * WindowTitlebar Component
 * Displays window title and control buttons
 */
export class WindowTitlebar extends LitElement {
  static properties = {
    title: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      user-select: none;
    }

    .titlebar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      height: var(--window-titlebar-height);
      background: var(--window-titlebar);
      border-bottom: 1px solid var(--color-border);
      padding: 0 var(--spacing-md);
      cursor: grab;
      border-top-left-radius: var(--radius-lg);
      border-top-right-radius: var(--radius-lg);
    }

    .titlebar:active {
      cursor: grabbing;
    }

    .window-controls {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .window-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      padding: 0 var(--spacing-md);
    }

    .control-button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: transparent;
    }

    .control-button:hover {
      color: rgba(0, 0, 0, 0.7);
    }

    .control-button.close {
      background: #ff5f57;
    }

    .control-button.close:hover {
      background: #e04b42;
    }

    .control-button.minimize {
      background: #ffbd2e;
    }

    .control-button.minimize:hover {
      background: #dfa520;
    }

    .control-button.center {
      background: #00d4ff;
    }

    .control-button.center:hover {
      background: #00b8e6;
    }

    .control-button.maximize {
      background: #28c840;
    }

    .control-button.maximize:hover {
      background: #1fa832;
    }

    /* Windows-style buttons on hover */
    .control-button:hover::before {
      content: attr(data-symbol);
      font-weight: bold;
    }

    .control-button.close::before {
      content: '×';
    }

    .control-button.minimize::before {
      content: '−';
    }

    .control-button.center::before {
      content: '□';
    }

    .control-button.maximize::before {
      content: '+';
    }

    @media (max-width: 768px) {
      .titlebar {
        height: 40px;
        padding: 0 var(--spacing-sm);
      }

      .control-button {
        width: 16px;
        height: 16px;
        font-size: 10px;
      }

      .window-title {
        font-size: var(--font-size-xs);
      }
    }
  `;

  constructor() {
    super();
    this.title = 'Untitled';
  }

  _handleDragStart(e) {
    // Don't start drag if clicking on control buttons
    if (e.target.classList.contains('control-button')) {
      return;
    }

    this.dispatchEvent(new CustomEvent('dragstart', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e }
    }));
  }

  _handleClose(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true
    }));
  }

  _handleMinimize(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('minimize', {
      bubbles: true,
      composed: true
    }));
  }

  _handleCenter(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('center', {
      bubbles: true,
      composed: true
    }));
  }

  _handleMaximize(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('maximize', {
      bubbles: true,
      composed: true
    }));
  }

  _handleDoubleClick() {
    this.dispatchEvent(new CustomEvent('maximize', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div
        class="titlebar"
        @mousedown=${this._handleDragStart}
        @touchstart=${this._handleDragStart}
        @dblclick=${this._handleDoubleClick}
      >
        <div class="window-controls">
          <button
            class="control-button close"
            @click=${this._handleClose}
            aria-label="Close window"
            title="Close (Cmd+Q)"
          ></button>

          <button
            class="control-button minimize"
            @click=${this._handleMinimize}
            aria-label="Minimize window"
            title="Minimize (Cmd+M)"
          ></button>

          <button
            class="control-button center"
            @click=${this._handleCenter}
            aria-label="Center window"
            title="Center window (Cmd+C)"
          ></button>

          <button
            class="control-button maximize"
            @click=${this._handleMaximize}
            aria-label="Maximize window"
            title="Maximize (Cmd+F)"
          ></button>
        </div>

        <div class="window-title">${this.title}</div>

        <!-- Empty div to maintain grid layout -->
        <div></div>
      </div>
    `;
  }
}

customElements.define('window-titlebar', WindowTitlebar);
