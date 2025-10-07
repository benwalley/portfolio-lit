/**
 * App Registry
 * Central registry of all available desktop applications
 */

/**
 * App definition structure:
 * @typedef {Object} AppDefinition
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} icon - Icon (emoji or path)
 * @property {string} component - Component type to render
 * @property {string} category - App category
 * @property {Object} defaultSize - Default window size
 * @property {string} description - Accessibility description
 * @property {Object} data - Additional app-specific data
 */

/**
 * Registry of all available applications
 */
export const APP_REGISTRY = [
  {
    id: 'about',
    name: 'About Me',
    icon: '👤',
    component: 'about-app',
    category: 'personal',
    defaultSize: { width: 600, height: 500 },
    description: 'View resume, bio, and professional information',
    data: {}
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '💻',
    component: 'terminal-app',
    category: 'utilities',
    defaultSize: { width: 800, height: 600 },
    description: 'Open terminal with command line interface',
    data: {}
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: '🚀',
    component: 'projects-app',
    category: 'portfolio',
    defaultSize: { width: 900, height: 700 },
    description: 'Browse portfolio projects and work samples',
    data: {}
  },
  {
    id: 'contact',
    name: 'Contact',
    icon: '📧',
    component: 'contact-app',
    category: 'personal',
    defaultSize: { width: 500, height: 600 },
    description: 'Send a message or view contact information',
    data: {}
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    component: 'settings-app',
    category: 'system',
    defaultSize: { width: 600, height: 500 },
    description: 'Configure application preferences and themes',
    data: {}
  },
  {
    id: 'files',
    name: 'Files',
    icon: '📁',
    component: 'files-app',
    category: 'utilities',
    defaultSize: { width: 800, height: 600 },
    description: 'Browse and manage files',
    data: {}
  }
];

/**
 * Get app by ID
 * @param {string} id - App identifier
 * @returns {AppDefinition|undefined}
 */
export function getAppById(id) {
  return APP_REGISTRY.find(app => app.id === id);
}

/**
 * Get app by component name
 * @param {string} component - Component name
 * @returns {AppDefinition|undefined}
 */
export function getAppByComponent(component) {
  return APP_REGISTRY.find(app => app.component === component);
}

/**
 * Get apps by category
 * @param {string} category - Category name
 * @returns {AppDefinition[]}
 */
export function getAppsByCategory(category) {
  return APP_REGISTRY.filter(app => app.category === category);
}

/**
 * Get all app IDs
 * @returns {string[]}
 */
export function getAllAppIds() {
  return APP_REGISTRY.map(app => app.id);
}

/**
 * Get all categories
 * @returns {string[]}
 */
export function getAllCategories() {
  const categories = new Set(APP_REGISTRY.map(app => app.category));
  return Array.from(categories);
}

/**
 * Check if app exists
 * @param {string} id - App identifier
 * @returns {boolean}
 */
export function appExists(id) {
  return APP_REGISTRY.some(app => app.id === id);
}

/**
 * Default icon positions (grid layout)
 * @param {number} iconSize - Icon size including spacing
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} columns - Number of columns
 * @returns {Object[]} Array of {appId, position: {x, y}}
 */
export function getDefaultIconPositions(
  iconSize = 100,
  startX = 20,
  startY = 20,
  columns = 6
) {
  return APP_REGISTRY.map((app, index) => ({
    appId: app.id,
    position: {
      x: startX + (index % columns) * iconSize,
      y: startY + Math.floor(index / columns) * iconSize
    }
  }));
}
