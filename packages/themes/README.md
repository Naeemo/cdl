# @naeemo/cdl-themes

CDL Theme System - Flicker-free, reusable theme configurations for CDL charts.

## Features

- **6 Preset Themes**: light, dark, colorful, vibrant, corporate, minimal
- **Flicker-free Switching**: CSS Custom Properties + preloaded ECharts themes
- **Smooth Transitions**: 0.3s animated theme changes
- **React Hook**: `useTheme()` for easy integration
- **TypeScript Support**: Full type definitions
- **Custom Themes**: Register your own themes

## Installation

```bash
npm install @naeemo/cdl-themes
```

## Quick Start

```typescript
import { getTheme, applyTheme, listThemes, type Theme } from '@naeemo/cdl-themes';

// List available themes
const themes = listThemes();
// ['light', 'dark', 'colorful', 'vibrant', 'corporate', 'minimal']

// Get a theme
const dark = getTheme('dark');

// Apply theme to chart config
const chartConfig = applyTheme({
  title: { text: 'Sales Chart' },
  series: [{ type: 'line' }],
}, 'dark');
```

## Flicker-free Theme Switching

### CSS Variables Approach

```typescript
import { 
  injectThemeStyles, 
  applyGlobalTheme, 
  preloadEChartsThemes,
  convertToEChartsTheme 
} from '@naeemo/cdl-themes';
import * as echarts from 'echarts';

// 1. Inject theme styles once at app startup
injectThemeStyles();

// 2. Preload all ECharts themes
preloadEChartsThemes(echarts);

// 3. Apply theme (instant, no flicker)
applyGlobalTheme('dark');
```

### React Hook

```tsx
import { useTheme } from '@naeemo/cdl-themes';

function App() {
  const { theme, setTheme, toggle, availableThemes } = useTheme({
    defaultTheme: 'light',
    persistKey: 'cdl-theme', // persists to localStorage
  });

  return (
    <div>
      <button onClick={() => toggle('light', 'dark')}>
        Toggle Theme
      </button>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        {availableThemes.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <CDLChart theme={theme} />
    </div>
  );
}
```

## Built-in Themes

### Light (default)
Clean, professional light theme suitable for most use cases.
- Background: `#ffffff`
- Primary colors: Blue, orange, red, teal palette

### Dark
Optimized for dark mode dashboards and presentations.
- Background: `#1a1a2e`
- Primary colors: Cyan, green, yellow, purple palette

### Colorful 🎨
Bright, playful theme with high-contrast candy colors on light background.
- Background: `#FEFEFE`
- Primary colors: `#FF6B6B`, `#4ECDC4`, `#45B7D1`, `#96CEB4`, `#FFEAA7`, `#DDA0DD`
- Best for: Dashboards, creative projects, data storytelling

### Vibrant
Bold, neon-style colors on dark background for high impact.
- Background: `#0a0a0f`
- Primary colors: Hot pink, orange, yellow, purple, cyan, neon green

### Corporate
Formal, business-appropriate styling for executive reports.
- Background: `#ffffff`
- Primary colors: Navy to orange gradient palette

### Minimal
Stripped-down, monochrome design for focused data presentation.
- Background: `#ffffff`
- Primary colors: Black to white grayscale

## Theme Structure

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string[];      // Color palette for data series
    background: string;     // Chart background
    foreground: string;     // Main text color
    grid: string;          // Grid lines
    text: string;          // Axis labels
    title: string;         // Chart title
    axis: string;          // Axis lines
    tooltip: {
      background: string;
      text: string;
      border: string;
    };
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      title: number;
    };
    fontWeight: {
      normal: number;
      bold: number;
    };
  };
  layout: {
    margin: { top, right, bottom, left };
    padding: { xs, sm, md, lg, xl };
    borderRadius: number;
  };
  animation: {
    duration: number;
    easing: string;
    delay: number;
  };
}
```

## Custom Themes

```typescript
import { registerTheme, type Theme } from '@naeemo/cdl-themes';

const myTheme: Theme = {
  name: 'brand',
  colors: {
    primary: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    background: '#ffffff',
    foreground: '#1a1a2e',
    grid: '#e8e8e8',
    text: '#333333',
    title: '#1a1a2e',
    axis: '#666666',
    tooltip: {
      background: 'rgba(255, 255, 255, 0.95)',
      text: '#333333',
      border: '#e8e8e8',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSize: { small: 11, medium: 13, large: 15, title: 18 },
    fontWeight: { normal: 400, bold: 600 },
  },
  layout: {
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    padding: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: 4,
  },
  animation: {
    duration: 750,
    easing: 'ease-out',
    delay: 0,
  },
};

registerTheme('brand', myTheme);
```

## CSS Variables

When using `injectThemeStyles()`, these CSS variables become available:

```css
:root {
  --cdl-bg: #ffffff;
  --cdl-fg: #1a1a2e;
  --cdl-text: #333333;
  --cdl-title: #1a1a2e;
  --cdl-axis: #666666;
  --cdl-grid: #e8e8e8;
  --cdl-tooltip-bg: rgba(255, 255, 255, 0.95);
  --cdl-tooltip-text: #333333;
  --cdl-tooltip-border: #e8e8e8;
  --cdl-primary-1: #4e79a7;
  --cdl-primary-2: #f28e2c;
  /* ... primary-8 */
  --cdl-font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  --cdl-font-size-sm: 11px;
  --cdl-font-size-md: 13px;
  --cdl-font-size-lg: 15px;
  --cdl-font-size-title: 18px;
  --cdl-border-radius: 4px;
  --cdl-animation-duration: 750ms;
}
```

Use in your CSS:

```css
.my-chart-container {
  background-color: var(--cdl-bg);
  color: var(--cdl-text);
  font-family: var(--cdl-font-family);
  border-radius: var(--cdl-border-radius);
}
```

## API Reference

### Theme Functions

- `getTheme(name: string): Theme` - Get theme by name
- `listThemes(): string[]` - List all available theme names
- `registerTheme(name: string, theme: Theme)` - Register a custom theme
- `applyTheme(config: object, themeName: string): object` - Apply theme to chart config

### Theme Switcher Functions

- `injectThemeStyles()` - Inject CSS for all themes (call once at startup)
- `applyGlobalTheme(theme, options)` - Apply theme to document root
- `applyCSSVariables(element, theme, options)` - Apply theme to specific element
- `preloadEChartsThemes(echarts)` - Preload all themes into ECharts
- `convertToEChartsTheme(theme)` - Convert CDL theme to ECharts format
- `switchTheme(container, newTheme, options)` - Switch theme with animation
- `createThemeManager(container, defaultTheme)` - Create theme manager instance

### React Hook

- `useTheme(options)` - React hook for theme management
  - `theme: string` - Current theme name
  - `themeObject: Theme` - Current theme object
  - `setTheme(name: string)` - Set theme
  - `toggle(themeA?, themeB?)` - Toggle between themes
  - `availableThemes: string[]` - List of available themes
  - `isTheme(name): boolean` - Check if current theme matches
  - `getCSSVar(name): string` - Get CSS variable value
  - `echartsTheme: object` - ECharts theme object

## Demo

Open `demo.html` in a browser to see the theme system in action with flicker-free switching.

## License

MIT
