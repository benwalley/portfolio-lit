# Portfolio OS

An OS-style portfolio website built with Lit web components, featuring draggable/resizable windows, multiple themes, and an interactive desktop environment.

## 🎯 Features

- 🪟 **Window System** - Fully draggable and resizable windows with minimize, maximize, and close
- 🎨 **Multiple Themes** - Dark, Light, macOS, and Glass themes with live switching
- ⌨️ **Keyboard Shortcuts** - Efficient window management via keyboard
- 💾 **State Persistence** - Theme and preferences saved to local storage
- 📱 **Responsive Design** - Works across desktop, tablet, and mobile devices
- ♿ **Accessible** - ARIA labels, keyboard navigation, and reduced motion support

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173/`

## 🎮 Usage

### Window Management

- **Drag**: Click and hold the title bar to move windows
- **Resize**: Drag from any edge or corner to resize
- **Minimize**: Click the yellow button (or Cmd/Ctrl + M)
- **Maximize**: Click the green button (or Cmd/Ctrl + F)
- **Close**: Click the red button (or Cmd/Ctrl + Q)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Q` | Close focused window |
| `Cmd/Ctrl + M` | Minimize focused window |
| `Cmd/Ctrl + F` | Maximize/restore focused window |
| `Cmd/Ctrl + T` | Open terminal (coming soon) |
| `Cmd/Ctrl + Tab` | Cycle through windows |

### Theme Switching

Click the theme button (emoji icon) in the top-right corner to switch between:
- 🌙 Dark mode
- ☀️ Light mode
- 🍎 macOS style
- ✨ Glass/frosted glass

## 📁 Project Structure

```
portfolio-lit/
├── src/
│   ├── components/       # Lit web components
│   │   ├── app-desktop.js
│   │   ├── top-bar.js
│   │   ├── app-bar.js
│   │   ├── os-window.js
│   │   └── window-titlebar.js
│   ├── context/          # State management
│   │   └── app-state.js
│   ├── styles/           # Global styles and themes
│   │   ├── reset.css
│   │   ├── themes.css
│   │   └── global.css
│   ├── utils/            # Helper functions
│   │   └── window-manager.js
│   ├── apps/             # Application components (coming soon)
│   └── data/             # Static data (coming soon)
├── public/               # Static assets
├── index.html            # Entry HTML
├── package.json
└── vite.config.js
```

## 🛠 Tech Stack

- **[Lit](https://lit.dev/)** - Fast, lightweight web components
- **[@lit/context](https://lit.dev/docs/data/context/)** - Context-based state management
- **[Vite](https://vitejs.dev/)** - Next-generation build tool
- **Vanilla JavaScript** - No TypeScript for simplicity
- **CSS Custom Properties** - For theming and design tokens

## 📋 Development Roadmap

See [development-steps.md](./development-steps.md) for the complete development plan.

### Current Status (Phase 1 & 2 Complete ✓)
- ✅ Project setup and architecture
- ✅ Theme system with 4 themes
- ✅ State management with Lit Context
- ✅ Window management (drag, resize, minimize, maximize)
- ✅ Desktop, top bar, and app bar components
- ✅ Keyboard shortcuts
- ✅ Local storage persistence

### Coming Soon (Phase 3-6)
- 🚧 Terminal application with simulated filesystem
- 🚧 About/Resume app
- 🚧 Project showcase with iframes
- 🚧 Settings app
- 🚧 Window animations
- 🚧 Mobile optimizations

## 🎨 Customization

### Adding a New Theme

Edit `src/styles/themes.css`:

```css
[data-theme="your-theme"] {
  --color-primary: #your-color;
  --color-background: #your-color;
  /* ... other variables */
}
```

Then add it to the theme switcher in `src/components/top-bar.js`.

### Creating a New Window

```javascript
import { appState } from './context/app-state.js';

appState.openWindow({
  title: 'My Window',
  component: 'my-component',
  size: { width: 600, height: 400 },
  position: { x: 100, y: 100 }
});
```

## 📝 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Project guidelines and instructions
- **[development-plan.md](./development-plan.md)** - High-level development phases
- **[development-steps.md](./development-steps.md)** - Detailed implementation steps
- **[features.md](./features.md)** - Complete feature documentation

## ♿ Accessibility

This project is built with accessibility in mind:

- All interactive elements have proper ARIA labels
- Full keyboard navigation support
- Focus indicators for keyboard users
- Respects `prefers-reduced-motion`
- Supports high contrast mode
- Screen reader friendly

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

## 📄 License

MIT License - feel free to use this as inspiration for your own projects.

## 🙏 Acknowledgments

- Built with [Lit](https://lit.dev/) by Google
- Inspired by macOS and classic desktop interfaces
- Icons are emoji for simplicity and universal support

---

**Development Status**: 🟢 Active Development

For detailed feature tracking, see [features.md](./features.md)
