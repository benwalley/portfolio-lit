import {LitElement, html, css} from 'lit';
import {ContextConsumer} from '@lit/context';
import {appStateContext} from '../context/app-state.js';
import './app-bar-icon.js';

/**
 * AppBar Component
 * Displays open applications and allows switching between them
 */
export class AppBar extends LitElement {
    static properties = {
        _state: {state: true}
    };

    static styles = css`
        :host {
            display: block;
            height: var(--appbar-height);
            background: var(--window-titlebar);
            border-top: 1px solid var(--color-border);
            z-index: var(--z-appbar);
            user-select: none;
        }

        .appbar {
            display: flex;
            align-items: center;
            height: 100%;
            padding: 0 var(--spacing-sm);
            gap: var(--spacing-xs);
            overflow-x: auto;
            overflow-y: hidden;
        }

        .appbar::-webkit-scrollbar {
            height: 4px;
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: var(--color-text-tertiary);
            font-size: var(--font-size-sm);
        }
    `;

    constructor() {
        super();
        this._state = {windows: []};
        this._unsubscribe = null;

        // Consume context
        new ContextConsumer(
            this,
            {
                context: appStateContext, callback: (value) => {
                    this.appState = value;
                    if (this._unsubscribe) {
                        this._unsubscribe();
                    }
                    if (value) {
                        this._state = value.getState();
                        this._unsubscribe = value.subscribe((state) => {
                            this._state = state;
                            this.requestUpdate();
                        });
                    }
                }, subscribe: true
            }
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }

    render() {
        const windows = this._state.windows;

        if (windows.length === 0) {
            return html`
                <div class="appbar">
                    <div class="empty-state">
                        No open applications
                    </div>
                </div>
            `;
        }

        return html`
            <div class="appbar">
                ${windows.map(windowData => html`
                    <app-bar-icon
                        .windowData=${windowData}
                        .appState=${this.appState}
                    ></app-bar-icon>
                `)}
            </div>
        `;
    }
}

customElements.define('app-bar', AppBar);
