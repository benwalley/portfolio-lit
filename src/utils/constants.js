/**
 * Application Constants
 * Centralized constants for layout, sizing, and configuration
 */

// Layout Dimensions
export const TOPBAR_HEIGHT = 32;
export const APPBAR_HEIGHT = 48;
export const WINDOW_TITLEBAR_HEIGHT = 36;
export const WINDOW_MIN_WIDTH = 300;
export const WINDOW_MIN_HEIGHT = 200;
export const WINDOW_INITIAL_WIDTH = 600;
export const WINDOW_INITIAL_HEIGHT = 400;

// Z-Index Layers
export const Z_INDEX = {
  DESKTOP: 0,
  WINDOW_BASE: 100,
  APPBAR: 900,
  TOPBAR: 1000,
  MODAL: 2000,
  TOOLTIP: 3000
};

// Window Management
export const WINDOW_CASCADE_OFFSET = 30;
export const WINDOW_CASCADE_MAX = 200;
export const WINDOW_SNAP_THRESHOLD = 20;
export const WINDOW_MIN_VISIBLE_PIXELS = 100;

// Position Defaults
export const DEFAULT_WINDOW_POSITION = { x: 100, y: 100 };

// Storage Keys
export const STORAGE_KEY_APP_STATE = 'portfolio-os-state';

// Debounce/Throttle Timings (ms)
export const DEBOUNCE_RESIZE = 250;
export const DEBOUNCE_AUTOSAVE = 1000;
export const TIME_UPDATE_INTERVAL = 1000;

// Themes
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  MACOS: 'macos',
  GLASS: 'glass',
  CUSTOM: 'custom'
};

// Keyboard Shortcuts
export const SHORTCUTS = {
  CLOSE_WINDOW: 'q',
  MINIMIZE_WINDOW: 'm',
  MAXIMIZE_WINDOW: 'f',
  OPEN_TERMINAL: 't',
  CYCLE_WINDOWS: 'tab'
};

// Desktop Icons
export const ICON_SIZE = 80;
export const ICON_SPACING = 100;
export const ICON_GRID_START_X = 20;
export const ICON_GRID_START_Y = 20;
export const ICON_GRID_COLUMNS = 8;
export const ICON_LABEL_MAX_LINES = 2;
export const ICON_DOUBLE_CLICK_DELAY = 300; // ms

// Icon Layout
export const ICON_LAYOUT = {
  GRID: 'grid',
  FREEFORM: 'freeform'
};

// Storage Keys
export const STORAGE_KEY_ICON_POSITIONS = 'portfolio-os-icon-positions';
export const STORAGE_KEY_ICON_LAYOUT = 'portfolio-os-icon-layout';

// Window Animations
export const ANIMATION = {
  WINDOW_MINIMIZE_DURATION: 280,
  WINDOW_RESTORE_DURATION: 280,
  WINDOW_MINIMIZE_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  WINDOW_RESTORE_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  SCALE_TARGET: 0.05,
  REDUCED_MOTION_DURATION: 0 // For prefers-reduced-motion
};
