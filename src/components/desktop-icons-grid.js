import { LitElement, html, css } from 'lit';
import { ContextConsumer } from '@lit/context';
import { appStateContext } from '../context/app-state.js';
import { APP_REGISTRY } from '../utils/app-registry.js';
import './desktop-icon.js';

/**
 * DesktopIconsGrid Component
 * Manages the layout and interaction of desktop icons
 */
export class DesktopIconsGrid extends LitElement {
  static properties = {
    _iconPositions: { state: true },
    _selectedIcons: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .icons-container {
      position: relative;
      width: 100%;
      height: 100%;
      pointer-events: auto;
    }

    /* Selection rectangle (for future multi-select) */
    .selection-rect {
      position: absolute;
      border: 2px dashed var(--color-primary);
      background: rgba(var(--color-primary-rgb, 0, 102, 255), 0.1);
      pointer-events: none;
      display: none;
    }

    .selection-rect.active {
      display: block;
    }
  `;

  constructor() {
    super();
    this._iconPositions = new Map();
    this._selectedIcons = new Set();

    // Consume context
    new ContextConsumer(
      this,
      { context: appStateContext, callback: (value) => {
        this.appState = value;
        this._initializeIconPositions();
      }}
    );
  }

  connectedCallback() {
    super.connectedCallback();
    // Listen for desktop clicks to deselect
    this.addEventListener('click', this._handleDesktopClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleDesktopClick);
  }

  /**
   * Initialize icon positions from app state or defaults
   */
  _initializeIconPositions() {
    if (!this.appState) return;

    const savedPositions = this.appState.getIconPositions();

    if (savedPositions && savedPositions.size > 0) {
      this._iconPositions = new Map(savedPositions);
    } else {
      // Create default grid positions
      this._createDefaultPositions();
    }
  }

  /**
   * Create default grid layout positions
   */
  _createDefaultPositions() {
    const iconSpacing = 100;
    const startX = 20;
    const startY = 20;
    const columns = 8;

    APP_REGISTRY.forEach((app, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      this._iconPositions.set(app.id, {
        x: startX + (col * iconSpacing),
        y: startY + (row * iconSpacing)
      });
    });

    // Save to state
    if (this.appState) {
      this.appState.setIconPositions(this._iconPositions);
    }

    this.requestUpdate();
  }

  /**
   * Handle icon selection
   */
  _handleIconSelect(e) {
    e.stopPropagation();
    const { appId, shiftKey, metaKey } = e.detail;

    if (metaKey) {
      // Cmd/Ctrl+Click: Toggle selection
      if (this._selectedIcons.has(appId)) {
        this._selectedIcons.delete(appId);
      } else {
        this._selectedIcons.add(appId);
      }
    } else if (shiftKey) {
      // Shift+Click: Add to selection
      this._selectedIcons.add(appId);
    } else {
      // Normal click: Select only this icon
      this._selectedIcons.clear();
      this._selectedIcons.add(appId);
    }

    this.requestUpdate();
  }

  /**
   * Handle icon launch (double-click)
   */
  _handleIconLaunch(e) {
    const { appId, appData } = e.detail;

    if (this.appState) {
      // Check if a window with this component is already open
      const existingWindowData = this.appState.findWindowByComponent(appData.component);

      if (existingWindowData) {
        // If window exists, restore it if minimized and focus it
        if (existingWindowData.isMinimized) {
          this.appState.restoreWindow(existingWindowData.id);
        } else {
          this.appState.focusWindow(existingWindowData.id);
        }
      } else {
        // Otherwise, open a new window
        this.appState.openWindow({
          title: appData.name,
          component: appData.component,
          size: appData.defaultSize,
          data: appData.data
        });
      }
    }

    // Clear selection after launch
    this._selectedIcons.clear();
    this.requestUpdate();
  }

  /**
   * Handle icon drag
   */
  _handleIconDrag(e) {
    const { appId, position } = e.detail;

    // Update position temporarily during drag
    this._iconPositions.set(appId, position);
    this.requestUpdate();
  }

  /**
   * Handle icon drop (end of drag)
   */
  _handleIconDrop(e) {
    const { appId, position } = e.detail;

    // Constrain to desktop bounds
    const constrained = this._constrainPosition(position);

    // Update final position
    this._iconPositions.set(appId, constrained);

    // Save to app state
    if (this.appState) {
      this.appState.setIconPositions(this._iconPositions);
    }

    this.requestUpdate();
  }

  /**
   * Constrain position to keep icon visible
   */
  _constrainPosition(position) {
    const minX = 0;
    const minY = 0;
    const maxX = window.innerWidth - 100; // Icon width
    const maxY = window.innerHeight - 150; // Icon height + bars

    return {
      x: Math.max(minX, Math.min(position.x, maxX)),
      y: Math.max(minY, Math.min(position.y, maxY))
    };
  }

  /**
   * Handle clicks on desktop background (deselect all)
   */
  _handleDesktopClick(e) {
    // Only deselect if clicking directly on the container
    if (e.target === this || e.target.classList.contains('icons-container')) {
      this._selectedIcons.clear();
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <div class="icons-container">
        ${APP_REGISTRY.map(app => {
          const position = this._iconPositions.get(app.id) || { x: 0, y: 0 };
          const selected = this._selectedIcons.has(app.id);

          return html`
            <desktop-icon
              .appData=${app}
              .position=${position}
              .selected=${selected}
              @icon-select=${this._handleIconSelect}
              @icon-launch=${this._handleIconLaunch}
              @icon-drag=${this._handleIconDrag}
              @icon-drop=${this._handleIconDrop}
            ></desktop-icon>
          `;
        })}
      </div>
    `;
  }
}

customElements.define('desktop-icons-grid', DesktopIconsGrid);
