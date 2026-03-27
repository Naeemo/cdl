/**
 * CDL Vue 包入口
 */

// Main component
export { default as CDLChart } from './CDLChart.vue';

// Dynamic component
export { DynamicCDLChart, useDynamicChart, useStreamingData } from './dynamic';
export type {
  UseDynamicChartOptions,
  UseDynamicChartReturn,
  UseStreamingDataOptions,
  UseStreamingDataReturn,
} from './dynamic';

// Dynamic core types
export type {
  DataSourceConfig,
  DataBatch,
  StreamStats,
  ChartDataState,
  ChartUpdateStrategy,
  DataPoint,
  DataStreamType,
} from './core';

export {
  DataStreamManager,
  ChartDataManager,
  defaultUpdateStrategy,
  timeSeriesUpdateStrategy,
} from './core';

// Accessibility utilities
export {
  isAccessibleToScreenReader,
  getAccessibleName,
  validateChartAccessibility,
  analyzeKeyboardNavigation,
  announceToScreenReader,
  isHighContrastMode,
  prefersReducedMotion,
} from './accessibility';

// 性能优化组合式函数
export {
  useVirtualScroll,
  useLazyLoad,
  useProgressiveRender,
  useChartPerformance,
  usePerformanceMonitor,
} from './composables/usePerformance';

export type {
  UseVirtualScrollOptions,
  VirtualScrollState,
  UseLazyLoadOptions,
  LazyLoadState,
  UseProgressiveRenderOptions,
  ProgressiveRenderState,
  UseChartPerformanceOptions,
  ChartPerformanceState,
  UsePerformanceMonitorOptions,
  PerformanceMonitorState,
  PerformanceMonitorActions,
} from './composables/usePerformance';