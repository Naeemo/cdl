/**
 * CDL Theme React Hook - Flicker-free theme switching for React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Theme, 
  getTheme, 
  listThemes, 
  injectThemeStyles, 
  applyCSSVariables,
  convertToEChartsTheme,
} from '../index';

export interface UseThemeOptions {
  /** Default theme name */
  defaultTheme?: string;
  /** Enable transition animation */
  enableTransition?: boolean;
  /** Persist theme to localStorage */
  persistKey?: string | null;
  /** Container element (default: document.documentElement) */
  container?: HTMLElement | null;
}

export interface UseThemeReturn {
  /** Current theme name */
  theme: string;
  /** Current theme object */
  themeObject: Theme;
  /** Available theme names */
  availableThemes: string[];
  /** Set theme by name */
  setTheme: (themeName: string) => void;
  /** Toggle between two themes */
  toggle: (themeA?: string, themeB?: string) => void;
  /** Check if theme is active */
  isTheme: (themeName: string) => boolean;
  /** Get CSS variable value */
  getCSSVar: (name: string) => string;
  /** ECharts theme object for current theme */
  echartsTheme: any;
}

/**
 * React hook for CDL theme management
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { theme, setTheme, toggle } = useTheme({ 
 *     defaultTheme: 'light',
 *     persistKey: 'cdl-theme'
 *   });
 *   
 *   return (
 *     <div>
 *       <button onClick={() => toggle('light', 'dark')}>
 *         Toggle Theme
 *       </button>
 *       <CDLChart theme={theme} /\u003e
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const {
    defaultTheme = 'light',
    enableTransition = true,
    persistKey = 'cdl-theme',
    container: customContainer,
  } = options;

  const [theme, setThemeState] = useState<string>(() => {
    // Try to restore from localStorage
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(persistKey);
      if (saved && listThemes().includes(saved)) {
        return saved;
      }
    }
    return defaultTheme;
  });

  const containerRef = useRef<HTMLElement | null>(customContainer || 
    (typeof document !== 'undefined' ? document.documentElement : null));

  // Inject theme styles on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      injectThemeStyles();
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!containerRef.current) return;

    applyCSSVariables(containerRef.current, theme, { 
      transition: enableTransition 
    });

    // Persist to localStorage
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(persistKey, theme);
    }
  }, [theme, enableTransition, persistKey]);

  const setTheme = useCallback((themeName: string) => {
    if (listThemes().includes(themeName)) {
      setThemeState(themeName);
    } else {
      console.warn(`[CDL Theme] Unknown theme: "${themeName}"`);
    }
  }, []);

  const toggle = useCallback((themeA: string = 'light', themeB: string = 'dark') => {
    setThemeState(prev => (prev === themeA ? themeB : themeA));
  }, []);

  const isTheme = useCallback((themeName: string) => {
    return theme === themeName;
  }, [theme]);

  const getCSSVar = useCallback((name: string) => {
    if (!containerRef.current) return '';
    return getComputedStyle(containerRef.current)
      .getPropertyValue(`--cdl-${name}`)
      .trim();
  }, []);

  const themeObject = getTheme(theme);
  const echartsTheme = convertToEChartsTheme(themeObject);

  return {
    theme,
    themeObject,
    availableThemes: listThemes(),
    setTheme,
    toggle,
    isTheme,
    getCSSVar,
    echartsTheme,
  };
}

export default useTheme;
