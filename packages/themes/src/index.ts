// CDL Theme System
// Reusable theme configurations for charts

export interface ThemeColors {
  primary: string[];
  background: string;
  foreground: string;
  grid: string;
  text: string;
  title: string;
  axis: string;
  tooltip: {
    background: string;
    text: string;
    border: string;
  };
}

export interface ThemeTypography {
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
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeLayout {
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  padding: ThemeSpacing;
  borderRadius: number;
}

export interface ThemeAnimation {
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay: number;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  animation: ThemeAnimation;
}

// Light Theme (Default)
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: [
      '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', 
      '#59a14f', '#edc949', '#af7aa1', '#ff9da7'
    ],
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      small: 11,
      medium: 13,
      large: 15,
      title: 18,
    },
    fontWeight: {
      normal: 400,
      bold: 600,
    },
  },
  layout: {
    margin: {
      top: 40,
      right: 40,
      bottom: 60,
      left: 60,
    },
    padding: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: 4,
  },
  animation: {
    duration: 750,
    easing: 'ease-out',
    delay: 0,
  },
};

// Dark Theme
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: [
      '#4fc3f7', '#29b6f6', '#66bb6a', '#ffa726', 
      '#ef5350', '#ab47bc', '#ffee58', '#26c6da'
    ],
    background: '#1a1a2e',
    foreground: '#ffffff',
    grid: '#2d2d44',
    text: '#b0b0c0',
    title: '#ffffff',
    axis: '#808090',
    tooltip: {
      background: 'rgba(45, 45, 68, 0.95)',
      text: '#ffffff',
      border: '#3d3d5c',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      small: 11,
      medium: 13,
      large: 15,
      title: 18,
    },
    fontWeight: {
      normal: 400,
      bold: 600,
    },
  },
  layout: {
    margin: {
      top: 40,
      right: 40,
      bottom: 60,
      left: 60,
    },
    padding: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: 4,
  },
  animation: {
    duration: 750,
    easing: 'ease-out',
    delay: 0,
  },
};

// Corporate Theme
export const corporateTheme: Theme = {
  name: 'corporate',
  colors: {
    primary: [
      '#003f5c', '#2f4b7c', '#665191', '#a05195', 
      '#d45087', '#f95d6a', '#ff7c43', '#ffa600'
    ],
    background: '#ffffff',
    foreground: '#1a1a2e',
    grid: '#f0f0f5',
    text: '#333344',
    title: '#1a1a2e',
    axis: '#666677',
    tooltip: {
      background: 'rgba(255, 255, 255, 0.98)',
      text: '#333344',
      border: '#e0e0e8',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: {
      small: 11,
      medium: 12,
      large: 14,
      title: 16,
    },
    fontWeight: {
      normal: 400,
      bold: 600,
    },
  },
  layout: {
    margin: {
      top: 32,
      right: 32,
      bottom: 48,
      left: 56,
    },
    padding: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 20,
      xl: 28,
    },
    borderRadius: 2,
  },
  animation: {
    duration: 500,
    easing: 'ease-in-out',
    delay: 0,
  },
};

// Minimal Theme
export const minimalTheme: Theme = {
  name: 'minimal',
  colors: {
    primary: [
      '#000000', '#333333', '#666666', '#999999', 
      '#cccccc', '#dddddd', '#eeeeee', '#f5f5f5'
    ],
    background: '#ffffff',
    foreground: '#000000',
    grid: '#f5f5f5',
    text: '#333333',
    title: '#000000',
    axis: '#999999',
    tooltip: {
      background: '#ffffff',
      text: '#000000',
      border: '#eeeeee',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      small: 10,
      medium: 12,
      large: 14,
      title: 16,
    },
    fontWeight: {
      normal: 400,
      bold: 500,
    },
  },
  layout: {
    margin: {
      top: 24,
      right: 24,
      bottom: 40,
      left: 48,
    },
    padding: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 16,
      xl: 24,
    },
    borderRadius: 0,
  },
  animation: {
    duration: 600,
    easing: 'ease-out',
    delay: 0,
  },
};

// Vibrant Theme
export const vibrantTheme: Theme = {
  name: 'vibrant',
  colors: {
    primary: [
      '#ff006e', '#fb5607', '#ffbe0b', '#8338ec', 
      '#3a86ff', '#06ffa5', '#ff4365', '#00d9ff'
    ],
    background: '#0a0a0f',
    foreground: '#ffffff',
    grid: '#1a1a2e',
    text: '#c0c0d0',
    title: '#ffffff',
    axis: '#808090',
    tooltip: {
      background: 'rgba(26, 26, 46, 0.98)',
      text: '#ffffff',
      border: '#2a2a4e',
    },
  },
  typography: {
    fontFamily: '"SF Pro Display", -apple-system, sans-serif',
    fontSize: {
      small: 11,
      medium: 13,
      large: 16,
      title: 20,
    },
    fontWeight: {
      normal: 400,
      bold: 700,
    },
  },
  layout: {
    margin: {
      top: 48,
      right: 48,
      bottom: 64,
      left: 72,
    },
    padding: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: 8,
  },
  animation: {
    duration: 1000,
    easing: 'ease-out',
    delay: 50,
  },
};

// Theme registry
const themes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  corporate: corporateTheme,
  minimal: minimalTheme,
  vibrant: vibrantTheme,
};

// Get theme by name
export function getTheme(name: string): Theme {
  return themes[name] || lightTheme;
}

// Register custom theme
export function registerTheme(name: string, theme: Theme): void {
  themes[name] = theme;
}

// List available themes
export function listThemes(): string[] {
  return Object.keys(themes);
}

// Apply theme to chart config
export function applyTheme(config: Record<string, unknown>, themeName: string): Record<string, unknown> {
  const theme = getTheme(themeName);
  
  return {
    ...config,
    backgroundColor: theme.colors.background,
    textStyle: {
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.medium,
    },
    title: {
      ...(config.title as Record<string, unknown> || {}),
      textStyle: {
        color: theme.colors.title,
        fontSize: theme.typography.fontSize.title,
        fontWeight: theme.typography.fontWeight.bold,
      },
    },
    color: theme.colors.primary,
    animationDuration: theme.animation.duration,
    animationEasing: theme.animation.easing,
  };
}

// Export all themes
export { themes };
export default {
  light: lightTheme,
  dark: darkTheme,
  corporate: corporateTheme,
  minimal: minimalTheme,
  vibrant: vibrantTheme,
  getTheme,
  registerTheme,
  listThemes,
  applyTheme,
};
