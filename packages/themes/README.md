# @cdl/themes

CDL Theme System - Reusable theme configurations for CDL charts.

## Installation

```bash
npm install @cdl/themes
```

## Usage

```typescript
import { getTheme, applyTheme, listThemes, type Theme } from '@cdl/themes';

// List available themes
const themes = listThemes();
// ['light', 'dark', 'corporate', 'minimal', 'vibrant']

// Get a theme
const dark = getTheme('dark');

// Apply theme to chart config
const chartConfig = applyTheme({
  title: { text: 'Sales Chart' },
  series: [{ type: 'line' }],
}, 'dark');
```

## Built-in Themes

### Light (default)
Clean, professional light theme suitable for most use cases.

### Dark
Optimized for dark mode dashboards and presentations.

### Corporate
Formal, business-appropriate styling for executive reports.

### Minimal
Stripped-down, monochrome design for focused data presentation.

### Vibrant
Bold, eye-catching colors for marketing and creative contexts.

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
import { registerTheme, type Theme } from '@cdl/themes';

const myTheme: Theme = {
  name: 'brand',
  colors: {
    primary: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    background: '#ffffff',
    // ... other properties
  },
  // ... rest of theme
};

registerTheme('brand', myTheme);
```

## @theme Directive in CDL

Use themes directly in CDL files:

```cdl
@theme("dark")

chart sales {
  type: line
  data: monthly_sales
  x: month
  y: revenue
  @title("Revenue Trend")
}
```

## License

MIT
