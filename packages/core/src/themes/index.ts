// CDL Core - Themes (simplified)
// Pure theme data, no DOM operations

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

export interface Theme {
  name: string;
  colors: ThemeColors;
}

// Light Theme (Default)
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949'],
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
};

// Dark Theme
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: ['#4fc3f7', '#29b6f6', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc'],
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
};

// Theme registry
const themes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

// Get theme by name
export function getTheme(name: string): Theme {
  return themes[name] || lightTheme;
}

// List available themes
export function listThemes(): string[] {
  return Object.keys(themes);
}

export { themes };