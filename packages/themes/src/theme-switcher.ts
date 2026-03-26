/**
 * CDL Theme Switcher - Flicker-free theme switching system
 * 
 * Features:
 * - CSS Custom Properties (variables) for instant theme application
 * - Preloading themes to prevent flash of unstyled content
 * - Smooth transitions between themes
 * - ECharts theme registration helpers
 */

import { Theme, getTheme, listThemes } from './index';

// CSS Variable prefix
const CSS_VAR_PREFIX = '--cdl-';

// CSS transition style for smooth theme switching
const THEME_TRANSITION_CSS = `
.cdl-theme-transition,
.cdl-theme-transition *,
.cdl-theme-transition *::before,
.cdl-theme-transition *::after {
  transition: background-color 0.3s ease,
              border-color 0.3s ease,
              color 0.3s ease,
              fill 0.3s ease,
              stroke 0.3s ease !important;
}
`;

/**
 * Generate CSS custom properties from theme
 */
export function generateCSSVariables(theme: Theme): Record<string, string> {
  return {
    [`${CSS_VAR_PREFIX}bg`]: theme.colors.background,
    [`${CSS_VAR_PREFIX}fg`]: theme.colors.foreground,
    [`${CSS_VAR_PREFIX}text`]: theme.colors.text,
    [`${CSS_VAR_PREFIX}title`]: theme.colors.title,
    [`${CSS_VAR_PREFIX}axis`]: theme.colors.axis,
    [`${CSS_VAR_PREFIX}grid`]: theme.colors.grid,
    [`${CSS_VAR_PREFIX}tooltip-bg`]: theme.colors.tooltip.background,
    [`${CSS_VAR_PREFIX}tooltip-text`]: theme.colors.tooltip.text,
    [`${CSS_VAR_PREFIX}tooltip-border`]: theme.colors.tooltip.border,
    [`${CSS_VAR_PREFIX}primary-1`]: theme.colors.primary[0] || '#000',
    [`${CSS_VAR_PREFIX}primary-2`]: theme.colors.primary[1] || '#000',
    [`${CSS_VAR_PREFIX}primary-3`]: theme.colors.primary[2] || '#000',
    [`${CSS_VAR_PREFIX}primary-4`]: theme.colors.primary[3] || '#000',
    [`${CSS_VAR_PREFIX}primary-5`]: theme.colors.primary[4] || '#000',
    [`${CSS_VAR_PREFIX}primary-6`]: theme.colors.primary[5] || '#000',
    [`${CSS_VAR_PREFIX}primary-7`]: theme.colors.primary[6] || '#000',
    [`${CSS_VAR_PREFIX}primary-8`]: theme.colors.primary[7] || '#000',
    [`${CSS_VAR_PREFIX}font-family`]: theme.typography.fontFamily,
    [`${CSS_VAR_PREFIX}font-size-sm`]: `${theme.typography.fontSize.small}px`,
    [`${CSS_VAR_PREFIX}font-size-md`]: `${theme.typography.fontSize.medium}px`,
    [`${CSS_VAR_PREFIX}font-size-lg`]: `${theme.typography.fontSize.large}px`,
    [`${CSS_VAR_PREFIX}font-size-title`]: `${theme.typography.fontSize.title}px`,
    [`${CSS_VAR_PREFIX}border-radius`]: `${theme.layout.borderRadius}px`,
    [`${CSS_VAR_PREFIX}animation-duration`]: `${theme.animation.duration}ms`,
  };
}

/**
 * Apply CSS variables to a container element
 */
export function applyCSSVariables(
  container: HTMLElement,
  theme: Theme | string,
  options: { transition?: boolean } = {}
): void {
  const themeObj = typeof theme === 'string' ? getTheme(theme) : theme;
  const variables = generateCSSVariables(themeObj);

  // Add transition class for smooth switching
  if (options.transition) {
    container.classList.add('cdl-theme-transition');
  }

  // Apply all CSS variables
  Object.entries(variables).forEach(([key, value]) => {
    container.style.setProperty(key, value);
  });

  // Set data attribute for theme name
  container.setAttribute('data-cdl-theme', themeObj.name);
}

/**
 * Apply CSS variables to document root (global theme)
 */
export function applyGlobalTheme(
  theme: Theme | string,
  options: { transition?: boolean } = {}
): void {
  applyCSSVariables(document.documentElement, theme, options);
}

/**
 * Generate CSS string for all themes (for preloading)
 */
export function generateAllThemesCSS(): string {
  const themes = listThemes();
  let css = '';

  // Generate CSS for each theme as a data attribute selector
  themes.forEach(themeName => {
    const theme = getTheme(themeName);
    const variables = generateCSSVariables(theme);
    
    css += `[data-cdl-theme="${themeName}"] {\n`;
    Object.entries(variables).forEach(([key, value]) => {
      css += `  ${key}: ${value};\n`;
    });
    css += '}\n\n';
  });

  return css;
}

/**
 * Inject theme styles into document head
 * Call this once at app initialization for flicker-free switching
 */
export function injectThemeStyles(): void {
  // Check if already injected
  if (document.getElementById('cdl-theme-styles')) {
    return;
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'cdl-theme-styles';
  styleEl.textContent = THEME_TRANSITION_CSS + '\n' + generateAllThemesCSS();
  document.head.appendChild(styleEl);
}

/**
 * Preload all themes into ECharts
 * Prevents flicker when switching themes in charts
 */
export function preloadEChartsThemes(echarts: any): void {
  const themes = listThemes();
  
  themes.forEach(themeName => {
    const theme = getTheme(themeName);
    
    // Register ECharts theme if not already registered
    if (!echarts.getTheme || !echarts.getTheme(themeName)) {
      const echartsTheme = convertToEChartsTheme(theme);
      echarts.registerTheme(themeName, echartsTheme);
    }
  });
}

/**
 * Convert CDL Theme to ECharts theme format
 */
export function convertToEChartsTheme(theme: Theme): any {
  return {
    color: theme.colors.primary,
    backgroundColor: theme.colors.background,
    textStyle: {
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
    },
    title: {
      textStyle: {
        color: theme.colors.title,
        fontSize: theme.typography.fontSize.title,
        fontWeight: theme.typography.fontWeight.bold,
      },
      subtextStyle: {
        color: theme.colors.axis,
      },
    },
    legend: {
      textStyle: {
        color: theme.colors.text,
      },
    },
    tooltip: {
      backgroundColor: theme.colors.tooltip.background,
      borderColor: theme.colors.tooltip.border,
      textStyle: {
        color: theme.colors.tooltip.text,
      },
    },
    axisPointer: {
      lineStyle: {
        color: theme.colors.grid,
      },
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: theme.colors.axis,
        },
      },
      axisLabel: {
        color: theme.colors.text,
      },
      splitLine: {
        lineStyle: {
          color: theme.colors.grid,
        },
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          color: theme.colors.axis,
        },
      },
      axisLabel: {
        color: theme.colors.text,
      },
      splitLine: {
        lineStyle: {
          color: theme.colors.grid,
        },
      },
    },
    grid: {
      borderColor: theme.colors.grid,
    },
  };
}

/**
 * Switch theme with smooth transition
 */
export async function switchTheme(
  container: HTMLElement,
  newTheme: Theme | string,
  options: {
    transition?: boolean;
    echartsInstances?: any[];
    echarts?: any;
  } = {}
): Promise<void> {
  const themeObj = typeof newTheme === 'string' ? getTheme(newTheme) : newTheme;

  // Enable transition
  if (options.transition !== false) {
    container.classList.add('cdl-theme-transition');
  }

  // Apply CSS variables
  applyCSSVariables(container, themeObj, { transition: false });

  // Update ECharts instances if provided
  if (options.echartsInstances && options.echarts) {
    // Dispose and recreate with new theme to ensure clean switch
    const instances = [...options.echartsInstances];
    
    for (const instance of instances) {
      if (instance && !instance.isDisposed()) {
        const dom = instance.getDom();
        const option = instance.getOption();
        
        // Dispose old instance
        instance.dispose();
        
        // Create new instance with new theme
        const newInstance = options.echarts.init(dom, themeObj.name);
        newInstance.setOption(option);
        
        // Replace in array
        const index = options.echartsInstances.indexOf(instance);
        if (index !== -1) {
          options.echartsInstances[index] = newInstance;
        }
      }
    }
  }

  // Remove transition class after animation completes
  if (options.transition !== false) {
    setTimeout(() => {
      container.classList.remove('cdl-theme-transition');
    }, 350);
  }
}

/**
 * Create a theme manager for a specific container
 */
export function createThemeManager(
  container: HTMLElement = document.documentElement,
  defaultTheme: string = 'light'
) {
  let currentTheme = defaultTheme;
  const listeners: Set<(theme: string) => void> = new Set();

  // Initialize
  injectThemeStyles();
  applyCSSVariables(container, defaultTheme);

  return {
    /**
     * Get current theme name
     */
    getCurrentTheme(): string {
      return currentTheme;
    },

    /**
     * Switch to a new theme
     */
    switch(themeName: string, options?: { transition?: boolean }): void {
      if (themeName === currentTheme) return;
      
      currentTheme = themeName;
      applyCSSVariables(container, themeName, options);
      
      // Notify listeners
      listeners.forEach(listener => listener(themeName));
    },

    /**
     * Subscribe to theme changes
     */
    onChange(listener: (theme: string) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /**
     * Toggle between two themes
     */
    toggle(themeA: string, themeB: string): void {
      this.switch(currentTheme === themeA ? themeB : themeA);
    },

    /**
     * Get CSS variable value
     */
    getCSSVariable(name: string): string {
      return getComputedStyle(container).getPropertyValue(`${CSS_VAR_PREFIX}${name}`).trim();
    },
  };
}

// Re-export theme types and functions
export { Theme, getTheme, listThemes, registerTheme } from './index';
