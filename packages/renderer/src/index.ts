// ECharts Renderer for CDL v0.6
// 入口文件：重新导出核心渲染函数、i18n支持、性能优化

export { render, setRenderLocale, getRenderLocale } from './renderer-v06';
export type { RenderOptions, RenderResult } from './renderer-v06';

// 导出 i18n 模块
export {
  t,
  setLocale,
  getLocale,
  configureI18n,
  formatNumber,
  formatDate,
  Locale,
  BuiltInKeys,
} from './i18n/index';

export {
  ChartI18n,
  getChartTypeName,
  translateAxisName,
  translateSeriesName,
  translateLegendNames,
  translateTitle,
  createTooltipFormatter,
  createPieTooltipFormatter,
  createGaugeFormatter,
  translateAggregation,
  applyI18nToOption,
} from './i18n/chart-i18n';

export {
  initLocales,
  detectBrowserLocale,
  getSupportedLocales,
} from './i18n/locale-loader';

// 导出性能优化模块
export {
  // 抽样算法
  lttbSampling,
  averageSampling,
  minMaxSampling,
  randomSampling,
  sampleData,
  
  // 虚拟滚动
  getVirtualScrollRange,
  
  // 数据聚合
  aggregateData,
  
  // 渐进渲染
  ProgressiveRenderer,
  
  // 懒加载
  LazyDataLoader,
  
  // 性能监控
  PerformanceMonitor,
  optimizeData,
  
  // 渲染器集成
  parsePerformanceHints,
  applyPerformanceOptimization,
  generateProgressiveConfig,
  generateDataZoomConfig,
  generateOptimizedTooltip,
  optimizeChartOption,
  createPerformanceStats,
  getOptimizationSuggestions,
} from './performance';

export type {
  PerformanceDataPoint,
  SamplingOptions,
  VirtualScrollOptions,
  LazyLoadOptions,
  ProgressiveOptions,
  AggregationOptions,
  PerformanceConfig as PerformanceOptimizationConfig,
  ChartPerformanceHints,
} from './performance';