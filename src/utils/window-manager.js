/**
 * Window Manager Utilities
 * Helper functions for window positioning, sizing, and management
 */

import {
  WINDOW_MIN_WIDTH,
  WINDOW_MIN_HEIGHT,
  WINDOW_CASCADE_OFFSET,
  WINDOW_CASCADE_MAX,
  WINDOW_SNAP_THRESHOLD,
  WINDOW_MIN_VISIBLE_PIXELS,
  TOPBAR_HEIGHT,
  APPBAR_HEIGHT
} from './constants.js';

/**
 * Constrain window position to keep it within desktop bounds
 * @param {Object} position - {x, y}
 * @param {Object} size - {width, height}
 * @param {Object} bounds - {width, height}
 * @returns {Object} - Constrained {x, y}
 */
export function constrainPosition(position, size, bounds) {
  const minX = 0;
  const minY = 0;
  const maxX = Math.max(bounds.width - size.width, 0);
  const maxY = Math.max(bounds.height - size.height, 0);

  return {
    x: Math.max(minX, Math.min(position.x, maxX)),
    y: Math.max(minY, Math.min(position.y, maxY))
  };
}

/**
 * Snap window to edge if within threshold
 * @param {Object} position - {x, y}
 * @param {Object} size - {width, height}
 * @param {Object} bounds - {width, height}
 * @param {number} threshold - Snap threshold in pixels
 * @returns {Object} - Snapped {x, y}
 */
export function snapToEdge(position, size, bounds, threshold = WINDOW_SNAP_THRESHOLD) {
  let { x, y } = position;

  // Snap to left edge
  if (x < threshold && x >= 0) {
    x = 0;
  }

  // Snap to right edge
  if (x > bounds.width - size.width - threshold && x <= bounds.width - size.width) {
    x = bounds.width - size.width;
  }

  // Snap to top edge
  if (y < threshold && y >= 0) {
    y = 0;
  }

  // Snap to bottom edge
  if (y > bounds.height - size.height - threshold && y <= bounds.height - size.height) {
    y = bounds.height - size.height;
  }

  return { x, y };
}

/**
 * Check if two windows overlap
 * @param {Object} windowData1 - {position: {x, y}, size: {width, height}}
 * @param {Object} windowData2 - {position: {x, y}, size: {width, height}}
 * @returns {boolean}
 */
export function isOverlapping(windowData1, windowData2) {
  const r1 = {
    left: windowData1.position.x,
    right: windowData1.position.x + windowData1.size.width,
    top: windowData1.position.y,
    bottom: windowData1.position.y + windowData1.size.height
  };

  const r2 = {
    left: windowData2.position.x,
    right: windowData2.position.x + windowData2.size.width,
    top: windowData2.position.y,
    bottom: windowData2.position.y + windowData2.size.height
  };

  return !(r1.right < r2.left ||
           r1.left > r2.right ||
           r1.bottom < r2.top ||
           r1.top > r2.bottom);
}

/**
 * Generate unique window ID
 * @returns {string}
 */
export function generateWindowId() {
  return `win-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate next z-index for a window
 * @param {Array} windows - Array of window objects
 * @returns {number}
 */
export function calculateNextZIndex(windows) {
  const { WINDOW_BASE } = require('./constants.js').Z_INDEX;
  if (windows.length === 0) return WINDOW_BASE;
  return Math.max(...windows.map(w => w.zIndex || WINDOW_BASE)) + 1;
}

/**
 * Get window bounds accounting for titlebar and chrome
 * @param {Object} desktopSize - {width, height}
 * @returns {Object} - {width, height}
 */
export function getAvailableDesktopBounds(desktopSize) {
  return {
    width: desktopSize.width,
    height: desktopSize.height - TOPBAR_HEIGHT - APPBAR_HEIGHT
  };
}

/**
 * Constrain window size to min/max bounds
 * @param {Object} size - {width, height}
 * @param {Object} minSize - {width, height}
 * @param {Object} maxSize - {width, height}
 * @returns {Object} - Constrained {width, height}
 */
export function constrainSize(
  size,
  minSize = { width: WINDOW_MIN_WIDTH, height: WINDOW_MIN_HEIGHT },
  maxSize = { width: Infinity, height: Infinity }
) {
  return {
    width: Math.max(minSize.width, Math.min(size.width, maxSize.width)),
    height: Math.max(minSize.height, Math.min(size.height, maxSize.height))
  };
}

/**
 * Calculate cascade position for new windows
 * @param {Array} windows - Existing windows
 * @returns {Object} - {x, y}
 */
export function getCascadePosition(windows) {
  const count = windows.length;
  const step = (count * WINDOW_CASCADE_OFFSET) % WINDOW_CASCADE_MAX;

  return {
    x: 100 + step,
    y: 100 + step
  };
}

/**
 * Get cursor style for resize handle
 * @param {string} handle - Handle identifier (n, s, e, w, ne, nw, se, sw)
 * @returns {string} - CSS cursor value
 */
export function getResizeCursor(handle) {
  const cursorMap = {
    'n': 'n-resize',
    's': 's-resize',
    'e': 'e-resize',
    'w': 'w-resize',
    'ne': 'ne-resize',
    'nw': 'nw-resize',
    'se': 'se-resize',
    'sw': 'sw-resize'
  };

  return cursorMap[handle] || 'default';
}

/**
 * Calculate new size and position during resize
 * @param {string} handle - Resize handle
 * @param {Object} startPos - Starting mouse position {x, y}
 * @param {Object} currentPos - Current mouse position {x, y}
 * @param {Object} originalWindowData - Original window state
 * @param {Object} minSize - Minimum size constraints
 * @returns {Object} - {position, size}
 */
export function calculateResize(
  handle,
  startPos,
  currentPos,
  originalWindowData,
  minSize = { width: WINDOW_MIN_WIDTH, height: WINDOW_MIN_HEIGHT }
) {
  const deltaX = currentPos.x - startPos.x;
  const deltaY = currentPos.y - startPos.y;

  let { x, y } = originalWindowData.position;
  let { width, height } = originalWindowData.size;

  // Handle horizontal resize
  if (handle.includes('e')) {
    width = Math.max(minSize.width, originalWindowData.size.width + deltaX);
  } else if (handle.includes('w')) {
    const newWidth = Math.max(minSize.width, originalWindowData.size.width - deltaX);
    const widthDiff = originalWindowData.size.width - newWidth;
    x = originalWindowData.position.x + widthDiff;
    width = newWidth;
  }

  // Handle vertical resize
  if (handle.includes('s')) {
    height = Math.max(minSize.height, originalWindowData.size.height + deltaY);
  } else if (handle.includes('n')) {
    const newHeight = Math.max(minSize.height, originalWindowData.size.height - deltaY);
    const heightDiff = originalWindowData.size.height - newHeight;
    y = originalWindowData.position.y + heightDiff;
    height = newHeight;
  }

  return {
    position: { x, y },
    size: { width, height }
  };
}

/**
 * Check if point is within window bounds
 * @param {Object} point - {x, y}
 * @param {Object} windowData - Window object
 * @returns {boolean}
 */
export function isPointInWindow(point, windowData) {
  return point.x >= windowData.position.x &&
         point.x <= windowData.position.x + windowData.size.width &&
         point.y >= windowData.position.y &&
         point.y <= windowData.position.y + windowData.size.height;
}

/**
 * Get window center point
 * @param {Object} windowData - Window object
 * @returns {Object} - {x, y}
 */
export function getWindowCenter(windowData) {
  return {
    x: windowData.position.x + windowData.size.width / 2,
    y: windowData.position.y + windowData.size.height / 2
  };
}

/**
 * Normalize window bounds to ensure it's visible
 * Useful after desktop resize
 * @param {Object} windowData - Window object
 * @param {Object} bounds - Desktop bounds
 * @returns {Object} - Updated window object
 */
export function normalizeWindowBounds(windowData, bounds) {
  let { x, y } = windowData.position;
  let { width, height } = windowData.size;

  // Constrain size
  width = Math.min(width, bounds.width);
  height = Math.min(height, bounds.height);

  // Ensure at least WINDOW_MIN_VISIBLE_PIXELS pixels are visible
  if (x + WINDOW_MIN_VISIBLE_PIXELS > bounds.width) {
    x = bounds.width - WINDOW_MIN_VISIBLE_PIXELS;
  }
  if (x + width < WINDOW_MIN_VISIBLE_PIXELS) {
    x = WINDOW_MIN_VISIBLE_PIXELS - width;
  }
  if (y + WINDOW_MIN_VISIBLE_PIXELS > bounds.height) {
    y = bounds.height - WINDOW_MIN_VISIBLE_PIXELS;
  }
  if (y < 0) {
    y = 0;
  }

  return {
    ...windowData,
    position: { x, y },
    size: { width, height }
  };
}
