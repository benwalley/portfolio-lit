# Development Steps - Portfolio OS

## Project Overview
Building an OS-style portfolio website using Lit web components with Vite. The application will feature draggable/resizable windows, multiple themes, a terminal interface, and project showcases.

## Core Architecture Decisions

### State Management
- **Lit Context** for global state (windows, theme, apps)
- **Local Storage** for persistence with periodic sync
- **Event-driven updates** for window management

### Component Hierarchy
```
app-desktop (root)
├── top-bar
│   ├── system-menu
│   ├── app-menu (context-aware)
│   └── system-info
├── os-window (multiple instances)
│   ├── window-titlebar
│   │   ├── window-controls
│   │   └── window-title
│   └── window-content (slot)
│       ├── terminal-app
│       ├── about-app
│       └── iframe-app
└── app-bar
    └── app-icon (per open window)
```

### Performance Considerations
- **Virtual DOM** (Lit's efficient rendering)
- **CSS transforms** for window dragging (no layout thrashing)
- **requestAnimationFrame** for smooth animations
- **Lazy loading** for terminal commands and apps
- **Debounced** local storage saves
- **CSS containment** for window isolation

---

## Phase 1: Foundation (Steps 1-5)

### Step 1: Global Styles & Theme System ✓
**Files to create:**
- `src/styles/reset.css` - CSS reset
- `src/styles/themes.css` - CSS custom properties for themes
- `src/styles/global.css` - Base styles, typography, utilities

**Themes to support:**
- Light mode
- Dark mode
- macOS style
- Glass/frosted glass
- Custom theme (user customizable)

**CSS Variables structure:**
```css
:root {
  --color-primary: ...;
  --color-background: ...;
  --color-surface: ...;
  --window-shadow: ...;
  --border-radius: ...;
  --transition-speed: ...;
}
```

### Step 2: App State Context
**File:** `src/context/app-state.js`

**State to manage:**
```javascript
{
  theme: 'dark',
  windows: [
    {
      id: 'win-1',
      title: 'Terminal',
      component: 'terminal-app',
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
      zIndex: 1,
      isMinimized: false,
      isMaximized: false,
      isFocused: true
    }
  ],
  nextZIndex: 2,
  desktopSize: { width: 1920, height: 1080 }
}
```

**Methods:**
- `openWindow(config)` - Create new window
- `closeWindow(id)` - Remove window
- `focusWindow(id)` - Bring to front
- `minimizeWindow(id)` - Hide window
- `maximizeWindow(id)` - Fullscreen window
- `updateWindowPosition(id, {x, y})` - Move window
- `updateWindowSize(id, {width, height})` - Resize window
- `setTheme(themeName)` - Change theme
- `saveToLocalStorage()` - Persist state
- `loadFromLocalStorage()` - Restore state

### Step 3: Window Manager Utilities
**File:** `src/utils/window-manager.js`

**Utilities:**
- `constrainPosition(pos, size, bounds)` - Keep window on screen
- `snapToEdge(pos, size, bounds)` - Window snapping
- `calculateZIndex(windows, targetId)` - Z-index management
- `isOverlapping(window1, window2)` - Collision detection
- `generateWindowId()` - Unique ID generation

### Step 4: Base Desktop Component
**File:** `src/components/app-desktop.js`

**Responsibilities:**
- Root component that provides context
- Renders windows, top bar, app bar
- Handles global keyboard shortcuts
- Manages desktop size/responsive breakpoints
- Initializes state from local storage

**Keyboard shortcuts:**
- `Cmd/Ctrl + Q` - Close focused window
- `Cmd/Ctrl + M` - Minimize focused window
- `Cmd/Ctrl + F` - Maximize/restore focused window
- `Cmd/Ctrl + T` - Open terminal
- `Cmd/Ctrl + Tab` - Cycle through windows

### Step 5: Top Bar Component
**File:** `src/components/top-bar.js`

**Features:**
- Logo/app name
- Context-aware menu (changes based on focused app)
- System info: time, date, battery (if available), network status
- Theme switcher
- Settings menu

**Accessibility:**
- Proper ARIA labels
- Keyboard navigation
- High contrast mode support

---

## Phase 2: Window System (Steps 6-8)

### Step 6: Window Titlebar Component
**File:** `src/components/window-titlebar.js`

**Features:**
- Window title (editable for some apps)
- Control buttons (minimize, maximize, close)
- Drag handle for moving window
- Double-click to maximize

**Accessibility:**
- Button labels
- Keyboard navigation
- Focus visible states

### Step 7: Core Window Component
**File:** `src/components/os-window.js`

**Features:**
- Draggable via titlebar
- 8-point resize handles (N, S, E, W, NE, NW, SE, SW)
- Focus management
- Minimize/maximize animations
- Content slot for apps
- Shadow/glow effects
- Smooth transitions

**Drag implementation:**
- Mouse events with pointer capture
- Touch support
- CSS transform for smooth movement
- Constraint to desktop bounds

**Resize implementation:**
- Resize handles in corners and edges
- Minimum size constraints
- Aspect ratio preservation (optional)
- Cursor change on hover

**Accessibility:**
- Keyboard resize/move mode
- Screen reader announcements
- Focus trap when modal

### Step 8: App Bar Component
**File:** `src/components/app-bar.js`

**Features:**
- Icons for open windows
- Click to focus/restore minimized
- Right-click context menu (close, minimize)
- Active window indicator
- Drag to reorder (optional)

---

## Phase 3: Terminal Application (Steps 9-12)

### Step 9: Terminal Component Structure
**File:** `src/apps/terminal-app.js`

**UI Elements:**
- Command prompt line
- Output area (scrollable)
- Input field (with history)
- Cursor simulation
- Command history (up/down arrows)

**Styling:**
- Monospace font
- Terminal theme variants
- Syntax highlighting for output
- ASCII art support

### Step 10: Filesystem Simulation
**File:** `src/utils/filesystem.js`

**Implementation:**
- Object-based file structure in local storage
- Directory tree with files and folders
- Permissions (read, write, execute)
- Current working directory tracking
- Path resolution (absolute and relative)

**Structure:**
```javascript
{
  '/': {
    'home': {
      'user': {
        'documents': {},
        'projects': {},
        'README.txt': 'Welcome to the terminal!'
      }
    },
    'bin': {},
    'etc': {}
  }
}
```

### Step 11: Command Parser & Executor
**File:** `src/utils/terminal-commands.js`

**Basic Commands:**
- `ls [-la]` - List directory contents
- `cd <path>` - Change directory
- `pwd` - Print working directory
- `mkdir <name>` - Create directory
- `touch <file>` - Create file
- `rm <file>` - Remove file
- `cat <file>` - Display file contents
- `echo <text> [> file]` - Print text or write to file
- `clear` - Clear terminal
- `help` - Show available commands
- `whoami` - Display user info
- `date` - Show current date/time
- `theme <name>` - Change theme

**Advanced Commands:**
- `find <pattern>` - Search files
- `grep <pattern> <file>` - Search in file
- `mv <src> <dest>` - Move/rename
- `cp <src> <dest>` - Copy file
- `curl <url>` - Fetch URL (limited)

**Special Commands:**
- `portfolio` - Open portfolio viewer
- `about` - Open about window
- `contact` - Open contact info
- `projects` - List projects

### Step 12: Terminal Features
**File:** Updates to `terminal-app.js`

**Features:**
- Command history (stored in local storage)
- Tab completion for files and commands
- Ctrl+C to cancel command
- Ctrl+L to clear
- Copy/paste support
- Text selection
- Search in output (Ctrl+F)

---

## Phase 4: Applications (Steps 13-15)

### Step 13: About/Resume App
**File:** `src/apps/about-app.js`

**Content:**
- Profile photo
- Bio/introduction
- Skills section
- Experience timeline
- Education
- Download resume button
- Social links

**Data file:** `src/data/resume.js`

### Step 14: Project Showcase Apps
**File:** `src/apps/iframe-app.js`

**Features:**
- Generic iframe wrapper component
- Loading state
- Error handling
- Responsive iframe sizing
- Security (sandbox attributes)

**Project data:** `src/data/projects.js`
```javascript
[
  {
    id: 'project-1',
    name: 'Project Name',
    description: '...',
    url: 'https://...',
    image: '/images/project-1.png',
    tags: ['React', 'Node.js']
  }
]
```

### Step 15: Settings App
**File:** `src/apps/settings-app.js`

**Settings:**
- Theme selection
- Window animation speed
- Terminal font size
- Accessibility options
- Reset to defaults
- Export/import settings

---

## Phase 5: Polish & Optimization (Steps 16-19)

### Step 16: Animations & Transitions
**File:** `src/styles/animations.css`

**Animations:**
- Window open (scale + fade)
- Window close (scale + fade)
- Window minimize (fly to app bar)
- Window maximize (expand to fullscreen)
- Window drag (subtle lift shadow)
- Smooth theme transitions
- Micro-interactions (buttons, hovers)

**Performance:**
- Use `transform` and `opacity` only
- `will-change` hints where needed
- Reduced motion media query support

### Step 17: Responsive Design
**Updates to all components**

**Breakpoints:**
- Desktop: > 1024px (full features)
- Tablet: 768px - 1024px (adjusted layouts)
- Mobile: < 768px (simplified, bottom sheet windows)

**Mobile adaptations:**
- Bottom sheet for windows
- Simplified drag (header bar drag)
- Touch-friendly resize handles
- Responsive top bar (hamburger menu)
- Vertical app bar

### Step 18: Accessibility Audit
**Checklist:**
- [ ] Keyboard navigation works everywhere
- [ ] Focus visible on all interactive elements
- [ ] ARIA labels on all buttons/controls
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader tested
- [ ] No keyboard traps
- [ ] Skip links provided
- [ ] Reduced motion respected
- [ ] High contrast mode support
- [ ] Text scaling works (up to 200%)

### Step 19: Performance Optimization
**Optimizations:**
- Code splitting for apps (dynamic imports)
- Lazy load terminal commands
- Debounce window resize/move updates
- Throttle local storage saves
- Optimize CSS (remove unused, minify)
- Image optimization
- Bundle size analysis
- Lighthouse score > 90

---

## Phase 6: Documentation & Testing (Steps 20-22)

### Step 20: Create Features Documentation
**File:** `features.md`

Document all implemented features with:
- Screenshots/GIFs
- Usage instructions
- Keyboard shortcuts
- Known limitations
- Browser compatibility

### Step 21: Update README
**File:** `README.md`

Include:
- Project description
- Tech stack
- Installation instructions
- Development commands
- Build/deploy process
- Project structure
- Contributing guidelines
- License

### Step 22: Code Documentation
**All component files**

Add:
- JSDoc comments for all public methods
- Component usage examples
- Props documentation
- Event documentation
- State management notes

---

## Future Enhancements (Post-MVP)

### Additional Apps
- File manager (visual)
- Calculator
- Notes app
- Music player
- Image viewer
- Code editor

### Advanced Features
- Multi-desktop support (workspaces)
- Window tiling/snapping layouts
- Global search
- Widgets/dashboard
- Real-time terminal collaboration
- Dark/light mode auto-switch based on time
- Custom cursor themes
- Boot sequence animation
- Login screen

### Performance
- Service worker for offline
- Progressive Web App (PWA)
- Web Workers for heavy operations
- Virtual scrolling for large lists

---

## Development Best Practices

### Code Style
- Use ESLint for linting
- Consistent naming (kebab-case for files, camelCase for variables)
- Keep components under 300 lines
- Extract reusable logic to utils
- Comment complex logic

### Git Workflow
- Feature branches
- Meaningful commit messages
- Regular commits (atomic changes)
- Test before committing

### Testing Strategy
- Manual testing during development
- Accessibility testing (keyboard, screen reader)
- Cross-browser testing (Chrome, Firefox, Safari)
- Responsive testing (mobile, tablet, desktop)
- Performance testing (Lighthouse)

### Debugging
- Browser DevTools
- Lit DevTools extension
- Console logging (remove in production)
- Error boundaries for robustness

---

## Success Metrics

- [ ] All core features working
- [ ] Accessible (WCAG AA compliant)
- [ ] Performant (Lighthouse > 90)
- [ ] Responsive (works on all screen sizes)
- [ ] Polished (smooth animations, good UX)
- [ ] Maintainable (clean code, documented)
- [ ] No console errors
- [ ] Local storage persistence works
- [ ] All keyboard shortcuts work
- [ ] Theme switching works smoothly
