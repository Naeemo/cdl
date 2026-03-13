/**
 * CDL 主题系统
 * 支持自定义配色、字体、动画等
 */

export interface ThemeConfig {
  name: string;
  colors: string[];
  background: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  animation: boolean;
  animationDuration: number;
}

export const defaultThemes: Record<string, ThemeConfig> = {
  default: {
    name: '默认',
    colors: ['#4fc3f7', '#7c4dff', '#ff4081', '#00e676', '#ffea00', '#ff9100'],
    background: '#ffffff',
    textColor: '#333333',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    animation: true,
    animationDuration: 1000
  },
  
  dark: {
    name: '深色',
    colors: ['#4fc3f7', '#7c4dff', '#ff4081', '#00e676', '#ffea00', '#ff9100'],
    background: '#1a1a2e',
    textColor: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    animation: true,
    animationDuration: 1000
  },
  
  ocean: {
    name: '海洋',
    colors: ['#006994', '#0096c7', '#48cae4', '#90e0ef', '#caf0f8', '#03045e'],
    background: '#f0f9ff',
    textColor: '#023e8a',
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    animation: true,
    animationDuration: 1200
  },
  
  forest: {
    name: '森林',
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#1b4332'],
    background: '#f8fdf9',
    textColor: '#1b4332',
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    animation: true,
    animationDuration: 1000
  },
  
  sunset: {
    name: '日落',
    colors: ['#ff6b6b', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'],
    background: '#fff9f0',
    textColor: '#2d3436',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    animation: true,
    animationDuration: 800
  },
  
  monochrome: {
    name: '单色',
    colors: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#74b9ff', '#0984e3'],
    background: '#ffffff',
    textColor: '#2d3436',
    fontFamily: 'Monaco, monospace',
    fontSize: 13,
    animation: false,
    animationDuration: 0
  }
};

/**
 * 应用主题到 ECharts 配置
 */
export function applyThemeToECharts(theme: ThemeConfig, option: any): any {
  return {
    ...option,
    backgroundColor: theme.background,
    textStyle: {
      color: theme.textColor,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize
    },
    title: option.title ? {
      ...option.title,
      textStyle: {
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize + 4
      }
    } : undefined,
    color: theme.colors,
    animation: theme.animation,
    animationDuration: theme.animationDuration
  };
}

/**
 * 应用主题到 D3 配置
 */
export function applyThemeToD3(theme: ThemeConfig): string {
  return `
    body {
      background-color: ${theme.background};
      font-family: ${theme.fontFamily};
      font-size: ${theme.fontSize}px;
    }
    .title { fill: ${theme.textColor}; }
    text { fill: ${theme.textColor}; }
  `;
}

/**
 * 获取主题列表
 */
export function getThemeList(): { id: string; name: string }[] {
  return Object.entries(defaultThemes).map(([id, theme]) => ({
    id,
    name: theme.name
  }));
}

/**
 * 获取主题配置
 */
export function getTheme(themeId: string): ThemeConfig {
  return defaultThemes[themeId] || defaultThemes.default;
}