import {LitElement, html, css} from 'lit';
import {getAppByComponent} from '../utils/app-registry.js';

/**
 * AppBarIcon Component
 * Represents a single app icon in the app bar
 */
export class AppBarIcon extends LitElement {
    static properties = {
        windowData: {type: Object},
        appState: {type: Object}
    };

    static styles = css`
        :host {
            display: block;
        }

        .app-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            padding: 0;
            border-radius: var(--radius-sm);
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            cursor: pointer;
            transition: all var(--transition-fast);
            position: relative;
            flex-shrink: 0;
        }

        .app-item:hover {
            background: var(--color-surface-hover);
            border-color: var(--color-border-focus);
        }

        .app-item.active {
            background: var(--color-primary);
            border-color: var(--color-primary);
            color: white;
        }

        .app-item.minimized {
            opacity: 0.6;
        }

        .app-icon {
            font-size: 24px;
            flex-shrink: 0;
        }

        .app-title {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: var(--spacing-xs);
            font-size: var(--font-size-sm);
            white-space: nowrap;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: var(--spacing-xs) var(--spacing-sm);
            box-shadow: var(--shadow-md);
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--transition-fast);
            z-index: 1000;
            font-weight: var(--font-weight-medium);
            color: var(--color-text-primary);
        }

        .app-item:hover .app-title {
            opacity: 1;
        }

        .close-button {
            position: absolute;
            top: -6px;
            right: -6px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--color-error);
            border: 2px solid var(--window-titlebar);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            opacity: 0;
            transition: all var(--transition-fast);
            flex-shrink: 0;
            cursor: pointer;
            z-index: 10;
        }

        .app-item:hover .close-button {
            opacity: 1;
        }

        .close-button:hover {
            transform: scale(1.1);
            background: var(--color-error);
        }

        @media (max-width: 768px) {
            .app-item {
                width: 40px;
                height: 40px;
            }

            .app-icon {
                font-size: 20px;
            }

            .app-title {
                font-size: var(--font-size-xs);
            }

            .close-button {
                width: 16px;
                height: 16px;
                font-size: 10px;
            }
        }
    `;

    constructor() {
        super();
        this.windowData = null;
        this.appState = null;
    }

    _getAppIcon() {
        const app = getAppByComponent(this.windowData.component);
        return app?.icon || '📄';
    }

    _handleAppClick() {
        if (!this.appState) return;

        if (this.windowData.isMinimized || !this.windowData.isFocused) {
            this.appState.restoreWindow(this.windowData.id);
        } else {
            this.appState.minimizeWindow(this.windowData.id);
        }
    }

    _handleCloseClick(e) {
        e.stopPropagation();
        if (!this.appState) return;
        this.appState.closeWindow(this.windowData.id);
    }

    render() {
        if (!this.windowData) return html``;

        const isActive = this.windowData.isFocused && !this.windowData.isMinimized;
        const isMinimized = this.windowData.isMinimized;

        return html`
            <div
                    class="app-item ${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}"
                    @click=${this._handleAppClick}
                    role="button"
                    tabindex="0"
                    aria-label="${this.windowData.title} - Click to ${isActive ? 'minimize' : 'restore'}"
                    title="${this.windowData.title}"
            >
                <div class="app-icon">${this._getAppIcon()}</div>
                <div class="app-title">${this.windowData.title}</div>
                <button
                        class="close-button"
                        @click=${this._handleCloseClick}
                        aria-label="Close ${this.windowData.title}"
                        title="Close"
                >
                    ×
                </button>
            </div>
        `;
    }
}

customElements.define('app-bar-icon', AppBarIcon);
