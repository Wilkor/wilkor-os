---
name: tiabete-ui-system
description: "Core UI/UX Identity and styling primitives for Tiabete web interfaces (Apps and Consoles)."
---

# Tiabete UI System

When building or modifying interfaces for the Tiabete ecosystem (whether the main PWA `tiabete-front` or the admin dashboard `console-tiabete`), you MUST strongly adhere to these premium visual identity rules. 

## 1. Core Principles
- **Modern & Premium**: Use Glassmorphism (blur backdrops), smooth hover translations (`transform: translateY(-2px)`), and rounded corners.
- **Micro-Animations**: All route changes and page-level mounting should glide using `framer-motion` (`fade` + `slide x: 10 to 0`).
- **Icons**: Always prefer `lucide-react`.

## 2. Typography
- **Primary Web Font**: `'Adam Script'` (used globally where applicable for branding, such as `index.css` resets).
- **Secondary Web Font**: `'Inter'`, `'Outfit'`, or `'Poppins'` (primary UI font for data and buttons within Material-UI `themes.js`).

## 3. Color Guidelines (Material-UI Theme)
Both light and dark themes exist. Ensure the `ThemeProvider` uses these exact HEX codes:

### Light Mode
- **Primary**: Main `#00BFA5`, Light `#64D8CB`, Dark `#00897B`
- **Secondary**: `#263238`
- **Background**: Default `#F4F7F6` (or `#F8FAFC`), Paper `#ffffff`
- **Text**: Primary `#1E293B`, Secondary `#64748B`

### Dark Mode
- **Primary**: Main `#1DE9B6` (Neon for dark mode), Dark `#00BFA5`
- **Secondary**: `#64748B`
- **Background**: Default `#0F172A`, Paper `#1E293B`
- **Text**: Primary `#F8FAFC`, Secondary `#94A3B8`

## 4. Components & Shapes

### Containers (Cards, Papers, Dialogs)
- **Border Radius**: Always `20px` or `24px` (`borderRadius: 16` in native MUI Shape fallback).
- **Glassmorphism (Dark/Light)**: Often uses `rgba(255, 255, 255, 0.7)` or `rgba(30, 41, 59, 0.6)` paired with `backdropFilter: 'blur(20px)'`.
- **Shadows**: Soft large shadows `0 10px 40px -10px rgba(0,0,0,0.08)` (Light).

### Buttons
- **Border Radius**: `12px`
- **Primary (Contained)**: Always a linear gradient: `background: 'linear-gradient(135deg, #00BFA5 0%, #00897B 100%)'`
- **Text Transform**: `none` (Do not use ALL CAPS).
- **Font Weight**: `600`

### Input Fields (TextFields)
- **Outlined Border Radius**: `12px`
- **Focus State**: `borderColor: '#00BFA5'` (Light) or `'#1DE9B6'` (Dark), `borderWidth: '1.5px'` or `'2px'`.

## 5. Navigation & Sidebars
- Active items in lists should feature the Primary color text.
- Active items must have a subtle background, e.g., `background: 'linear-gradient(90deg, rgba(0, 191, 165, 0.15) 0%, rgba(0, 191, 165, 0.05) 100%)'`.
- Add a left indicator line: `borderLeft: '4px solid #00BFA5'`.
- Include a `lucide-react` indicator icon on active state: `<ChevronRight size={16} color="#00BFA5" />`

## 6. Layout Transitions
Implement `AnimatedRoutes` around `react-router-dom`:

```javascript
import { AnimatePresence, motion } from 'framer-motion';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

Wrap your `<Routes>` with `<AnimatePresence mode="wait">`. Every `<Route element={...} />` should be wrapped in `<PageWrapper>`.
