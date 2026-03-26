export { render, setRenderLocale, getRenderLocale } from './renderer-v06';
export type { RenderOptions, RenderResult } from './renderer-v06';
export { t, setLocale, getLocale, configureI18n, formatNumber, formatDate, Locale, BuiltInKeys, } from './i18n/index';
export { ChartI18n, getChartTypeName, translateAxisName, translateSeriesName, translateLegendNames, translateTitle, createTooltipFormatter, createPieTooltipFormatter, createGaugeFormatter, translateAggregation, applyI18nToOption, } from './i18n/chart-i18n';
export { initLocales, detectBrowserLocale, getSupportedLocales, } from './i18n/locale-loader';
export { lttbSampling, averageSampling, minMaxSampling, randomSampling, sampleData, getVirtualScrollRange, aggregateData, ProgressiveRenderer, LazyDataLoader, PerformanceMonitor, optimizeData, parsePerformanceHints, applyPerformanceOptimization, generateProgressiveConfig, generateDataZoomConfig, generateOptimizedTooltip, optimizeChartOption, createPerformanceStats, getOptimizationSuggestions, } from './performance';
export type { PerformanceDataPoint, SamplingOptions, VirtualScrollOptions, LazyLoadOptions, ProgressiveOptions, AggregationOptions, PerformanceConfig as PerformanceOptimizationConfig, ChartPerformanceHints, } from './performance';
//# sourceMappingURL=index.d.ts.map