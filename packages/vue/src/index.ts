/**
 * CDL Vue 包入口
 */

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
