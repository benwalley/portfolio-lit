# CLAUDE.md

\
## Project Overview

This is a portfolio website project built as an OS-style interface using Lit web components.


## Accessibility
It is important to ensure that all code is built with strict accessibility standards in mind.

## Features
- OS-style interface
- Window system
  - Can have an iframe, a component, or something else in the window
- Draggable windows
- Resizable windows
- Minimize and maximize functionality
- Multiple themes
  - Light, dark, macOS, custom, glass, etc.
- Responsive design for various screen sizes
- Terminal interface
  - simulated file system using local storage
  - Possibly connect to actual local file system in the future
- iframe windows for projects I've done.
- Subtle animations and transitions
- An "app" window with contact info and resume.
- App bar with open apps.
- Top bar with time, date, and system info, and menus based on the open app.

## Architecture
- Vite as the build tool
- Built with Lit web components
- State management using Lit Context.
  - Periodically save state to local storage
- iframes for project showcases
- No Routes or backend. Only state on the frontend
- Everything should be architected with the idea that it will grow and have features added.
- Javascript and not typescript for simplicity
