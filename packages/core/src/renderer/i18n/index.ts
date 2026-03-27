/**
 * CDL Renderer i18n - Internationalization support for chart labels, tooltips, and legends
 */

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'de-DE' | 'fr-FR' | 'es-ES' | 'ru-RU' | 'pt-BR' | 'it-IT';

export interface I18nConfig {
  locale: Locale;
  fallbackLocale?: Locale;
  translations?: Record<string, string>;
}

// 翻译数据存储
const translations: Map<Locale, Map<string, string>> = new Map();

// 当前配置
let currentConfig: I18nConfig = {
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
};

/**
 * 注册翻译数据
 */
export function registerTranslations(locale: Locale, data: Record<string, string>): void {
  const map = new Map<string, string>();
  Object.entries(data).forEach(([key, value]) => {
    map.set(key, value);
  });
  translations.set(locale, map);
}

/**
 * 设置当前语言
 */
export function setLocale(locale: Locale): void {
  currentConfig.locale = locale;
}

/**
 * 获取当前语言
 */
export function getLocale(): Locale {
  return currentConfig.locale;
}

/**
 * 配置 i18n
 */
export function configureI18n(config: I18nConfig): void {
  currentConfig = { ...currentConfig, ...config };
  if (config.translations) {
    registerTranslations(config.locale, config.translations);
  }
}

/**
 * 获取翻译文本
 * @param key 翻译键
 * @param defaultValue 默认值（可选）
 * @param params 插值参数（可选）
 * @returns 翻译后的文本
 */
export function t(key: string, defaultValue?: string, params?: Record<string, string | number>): string {
  // 先尝试当前语言
  let value = translations.get(currentConfig.locale)?.get(key);
  
  // 如果没有找到，尝试回退语言
  if (!value && currentConfig.fallbackLocale && currentConfig.fallbackLocale !== currentConfig.locale) {
    value = translations.get(currentConfig.fallbackLocale)?.get(key);
  }
  
  // 如果还没有，使用默认值或键名
  if (!value) {
    value = defaultValue || key;
  }
  
  // 处理插值参数
  if (params) {
    value = interpolate(value, params);
  }
  
  return value;
}

/**
 * 字符串插值
 * 支持 {key} 和 {{key}} 格式
 */
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{?(.+?)\}\}?/g, (match, key) => {
    const trimmedKey = key.trim();
    const value = params[trimmedKey];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * 批量翻译（用于图例、系列名等数组）
 */
export function tArray(keys: string[], defaults?: string[]): string[] {
  return keys.map((key, index) => t(key, defaults?.[index] || key));
}

/**
 * 翻译对象属性
 */
export function tObject<T extends Record<string, any>>(
  obj: T,
  keysToTranslate: (keyof T)[]
): T {
  const result = { ...obj };
  keysToTranslate.forEach(key => {
    const value = result[key];
    if (typeof value === 'string') {
      (result as any)[key] = t(value, value);
    }
  });
  return result;
}

/**
 * 获取数字/日期格式化器
 */
export function getNumberFormatter(
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  return new Intl.NumberFormat(currentConfig.locale, options);
}

export function getDateFormatter(
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(currentConfig.locale, options);
}

/**
 * 格式化数字
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return getNumberFormatter(options).format(value);
}

/**
 * 格式化日期
 */
export function formatDate(
  value: Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return getDateFormatter(options).format(value);
}

// 重新导出 locale loader
export { initLocales, detectBrowserLocale, getSupportedLocales } from './locale-loader';

// 内置通用翻译键
export const BuiltInKeys = {
  // 图表类型
  CHART_LINE: 'chart.line',
  CHART_BAR: 'chart.bar',
  CHART_PIE: 'chart.pie',
  CHART_SCATTER: 'chart.scatter',
  CHART_AREA: 'chart.area',
  CHART_RADAR: 'chart.radar',
  CHART_FUNNEL: 'chart.funnel',
  CHART_TREEMAP: 'chart.treemap',
  CHART_SUNBURST: 'chart.sunburst',
  CHART_SANKEY: 'chart.sankey',
  CHART_GAUGE: 'chart.gauge',
  CHART_CANDLESTICK: 'chart.candlestick',
  CHART_BOXPLOT: 'chart.boxplot',
  CHART_HEATMAP: 'chart.heatmap',
  CHART_MAP: 'chart.map',
  CHART_GRAPH: 'chart.graph',
  
  // 通用标签
  TOTAL: 'label.total',
  AVERAGE: 'label.average',
  COUNT: 'label.count',
  MAX: 'label.max',
  MIN: 'label.min',
  SUM: 'label.sum',
  
  // 提示框
  TOOLTIP_NO_DATA: 'tooltip.noData',
  
  // 按钮/操作
  ACTION_DOWNLOAD: 'action.download',
  ACTION_REFRESH: 'action.refresh',
  ACTION_ZOOM: 'action.zoom',
  ACTION_RESET: 'action.reset',
  
  // 数据相关
  DATA_EMPTY: 'data.empty',
  DATA_LOADING: 'data.loading',
  DATA_ERROR: 'data.error',
} as const;

// 重新导出类型
export type { I18nConfig as I18nOptions };
