import { createContext } from '@lit/context';
import { generateWindowId } from '../utils/window-manager.js';
import {
  Z_INDEX,
  WINDOW_INITIAL_WIDTH,
  WINDOW_INITIAL_HEIGHT,
  WINDOW_CASCADE_OFFSET,
  WINDOW_CASCADE_MAX,
  STORAGE_KEY_APP_STATE,
  THEMES
} from '../utils/constants.js';

/**
 * App State Context
 * Manages global application state including windows, theme, and desktop
 */

export const appStateContext = createContext('app-state');

/**
 * Initial state structure
 */
export const initialState = {
  theme: THEMES.DARK,
  windows: [],
  nextZIndex: Z_INDEX.WINDOW_BASE,
  desktopSize: { width: window.innerWidth, height: window.innerHeight },
  focusedWindowId: null,
  iconPositions: new Map(), // Map of appId -> {x, y}
  selectedIcons: new Set() // Set of selected appId strings
};

/**
 * Create app state with methods
 */
export class AppState {
  constructor() {
    this.state = { ...initialState };
    this.listeners = new Set();
    this._saveTimeout = null;
    this.loadFromLocalStorage();
    this.setupAutoSave();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  /**
   * Update state and notify listeners
   */
  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Update a specific window by ID with simple property updates
   * @private
   * @param {string} id - Window ID
   * @param {Object} updates - Properties to update
   * @returns {Array} Updated windows array
   */
  _updateWindow(id, updates) {
    return this.state.windows.map(w =>
      w.id === id ? { ...w, ...updates } : w
    );
  }

  /**
   * Update a specific window by ID using a function
   * @private
   * @param {string} id - Window ID
   * @param {Function} updateFn - Function that receives window and returns updated window
   * @returns {Array} Updated windows array
   */
  _updateWindowWith(id, updateFn) {
    return this.state.windows.map(w =>
      w.id === id ? updateFn(w) : w
    );
  }

  /**
   * Open a new window
   * @param {Object} config - Window configuration
   */
  openWindow(config) {
    const id = config.id || generateWindowId();

    const defaultWindow = {
      id,
      title: config.title || 'Untitled',
      component: config.component || 'div',
      position: config.position || this.getDefaultPosition(),
      size: config.size || { width: WINDOW_INITIAL_WIDTH, height: WINDOW_INITIAL_HEIGHT },
      zIndex: this.state.nextZIndex,
      isMinimized: false,
      isFocused: true,
      data: config.data || {},
      _isNewlyOpened: true
    };

    // Unfocus all other windows
    const windows = this.state.windows.map(w => ({ ...w, isFocused: false }));
    windows.push(defaultWindow);

    this.updateState({
      windows,
      nextZIndex: this.state.nextZIndex + 1,
      focusedWindowId: id
    });

    return id;
  }

  /**
   * Close a window
   */
  closeWindow(id) {
    const windows = this.state.windows.filter(w => w.id !== id);

    // Focus the next highest window if the closed one was focused
    let focusedWindowId = this.state.focusedWindowId;
    if (focusedWindowId === id && windows.length > 0) {
      const nextWindow = windows.reduce((max, w) =>
        w.zIndex > max.zIndex ? w : max, windows[0]);
      nextWindow.isFocused = true;
      focusedWindowId = nextWindow.id;
    } else if (windows.length === 0) {
      focusedWindowId = null;
    }

    this.updateState({ windows, focusedWindowId });
  }

  /**
   * Focus a window (bring to front)
   */
  focusWindow(id) {
    // Unfocus all windows, then focus and restore the target
    const windows = this.state.windows.map(w => {
      if (w.id === id) {
        return { ...w, isFocused: true, zIndex: this.state.nextZIndex, isMinimized: false };
      }
      return { ...w, isFocused: false };
    });

    this.updateState({
      windows,
      nextZIndex: this.state.nextZIndex + 1,
      focusedWindowId: id
    });
  }

  /**
   * Minimize a window
   * @param {string} id - Window ID
   */
  minimizeWindow(id) {
    const windows = this._updateWindow(id, {
      isMinimized: true,
      isFocused: false
    });

    // Focus next visible window
    const visibleWindows = windows.filter(w => !w.isMinimized);
    let focusedWindowId = null;

    if (visibleWindows.length > 0) {
      const nextWindow = visibleWindows.reduce((max, w) =>
        w.zIndex > max.zIndex ? w : max, visibleWindows[0]);
      nextWindow.isFocused = true;
      focusedWindowId = nextWindow.id;
    }

    this.updateState({ windows, focusedWindowId });
  }

  /**
   * Restore a minimized window
   * @param {string} id - Window ID
   */
  restoreWindow(id) {
    this.focusWindow(id);
  }

  /**
   * Maximize window - resize to fill available space
   */
  maximizeWindow(id) {
    const windows = this._updateWindowWith(id, (w) => ({
      ...w,
      position: { x: 0, y: 0 }, // Top bar height
      size: {
        width: this.state.desktopSize.width,
        height: this.state.desktopSize.height - 80 // Minus top and app bars
      }
    }));

    this.updateState({ windows });
  }

  /**
   * Center window - resize to half width and center on screen
   */
  centerWindow(id) {
    const halfWidth = Math.floor(this.state.desktopSize.width / 2);
    const centerHeight = Math.floor((this.state.desktopSize.height - 80) * 0.7);
    const x = Math.floor((this.state.desktopSize.width - halfWidth) / 2);
    const y = 80;

    const windows = this._updateWindow(id, {
      position: { x, y },
      size: { width: halfWidth, height: centerHeight }
    });

    this.updateState({ windows });
  }

  /**
   * Update window position
   */
  updateWindowPosition(id, position) {
    const windows = this._updateWindow(id, { position });
    this.updateState({ windows });
  }

  /**
   * Update window size
   */
  updateWindowSize(id, size) {
    const windows = this._updateWindow(id, { size });
    this.updateState({ windows });
  }

  /**
   * Set application theme
   */
  setTheme(theme) {
    this.updateState({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    this.saveToLocalStorage();
  }

  /**
   * Update desktop size (on window resize)
   */
  updateDesktopSize(size) {
    this.updateState({ desktopSize: size });
  }

  /**
   * Get default window position (cascading)
   */
  getDefaultPosition() {
    const offset = (this.state.windows.length * WINDOW_CASCADE_OFFSET) % WINDOW_CASCADE_MAX;
    return {
      x: 100 + offset,
      y: 100 + offset
    };
  }

  /**
   * Save state to local storage (debounced)
   */
  saveToLocalStorage() {
    try {
      const stateToSave = {
        theme: this.state.theme,
        windows: this.state.windows,
        iconPositions: Array.from(this.state.iconPositions.entries())
      };

      const serialized = JSON.stringify(stateToSave);
      localStorage.setItem(STORAGE_KEY_APP_STATE, serialized);
    } catch (error) {
      // Handle quota exceeded or other localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Unable to save state.');
        // Optionally: clear old data or notify user
      } else {
        console.error('Failed to save state to localStorage:', error);
      }
    }
  }

  /**
   * Load state from local storage
   */
  loadFromLocalStorage() {
    try {
    const saved = localStorage.getItem(STORAGE_KEY_APP_STATE);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      // Validate parsed data before applying
      if (!parsed || typeof parsed !== 'object') {
        console.warn('Invalid state data in localStorage');
        return;
      }

      // Apply theme if valid
      if (parsed.theme && Object.values(THEMES).includes(parsed.theme)) {
        this.state.theme = parsed.theme;
        document.documentElement.setAttribute('data-theme', parsed.theme);
      }

      // Restore icon positions if they exist
      if (parsed.iconPositions && Array.isArray(parsed.iconPositions)) {
        this.state.iconPositions = new Map(parsed.iconPositions);
      }

      this.state.windows = parsed.windows

    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY_APP_STATE);
      } catch (clearError) {
        // localStorage might be completely unavailable
        console.error('Failed to clear corrupted localStorage:', clearError);
      }
    }
  }

  /**
   * Setup auto-save on state changes (debounced)
   */
  setupAutoSave() {
    this.subscribe(() => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => {
        this.saveToLocalStorage();
      }, 1000);
    });
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get window by ID
   */
  getWindow(id) {
    return this.state.windows.find(w => w.id === id);
  }

  /**
   * Get focused window
   */
  getFocusedWindow() {
    return this.state.windows.find(w => w.isFocused);
  }

  /**
   * Find window by component type
   */
  findWindowByComponent(component) {
    return this.state.windows.find(w => w.component === component);
  }

  /**
   * Get icon positions
   */
  getIconPositions() {
    return this.state.iconPositions;
  }

  /**
   * Set icon positions
   * @param {Map} positions - Map of appId -> {x, y}
   */
  setIconPositions(positions) {
    this.state.iconPositions = new Map(positions);
    this.notify();
    this.saveToLocalStorage();
  }

  /**
   * Update single icon position
   * @param {string} appId - App identifier
   * @param {Object} position - {x, y}
   */
  updateIconPosition(appId, position) {
    this.state.iconPositions.set(appId, position);
    this.notify();
  }

  /**
   * Get selected icons
   */
  getSelectedIcons() {
    return this.state.selectedIcons;
  }

  /**
   * Set selected icons
   * @param {Set} icons - Set of appId strings
   */
  setSelectedIcons(icons) {
    this.state.selectedIcons = new Set(icons);
    this.notify();
  }

  /**
   * Clear selected icons
   */
  clearSelectedIcons() {
    this.state.selectedIcons.clear();
    this.notify();
  }
}

/**
 * Create singleton instance
 */
export const appState = new AppState();
