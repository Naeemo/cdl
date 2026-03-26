export { CDLChart, default } from './CDLChart';
export type { 
  DrillDownPath, 
  DetailData 
} from './CDLChart';

// Accessibility exports
export {
  isAccessibleToScreenReader,
  getAccessibleName,
  validateChartAccessibility,
  analyzeKeyboardNavigation,
  announceToScreenReader,
  createFocusTrap,
  isHighContrastMode,
  prefersReducedMotion,
} from './accessibility';

// Linkage exports
export { 
  ChartLinkageProvider, 
  useChartLinkage,
  useChartLinkageContext,
  useLinkageGroup,
  generateChartId,
  ChartLinkageContext
} from './hooks/useChartLinkage';
export type { 
  LinkageConfig, 
  LinkageEvent,
  LinkageContextState
} from './hooks/useChartLinkage';

// Performance optimization hooks
export {
  useVirtualScroll,
  useLazyLoad,
  useProgressiveRender,
  useChartPerformance,
  usePerformanceMonitor,
} from './hooks/usePerformance';
export type {
  UseVirtualScrollOptions,
  VirtualScrollState,
  UseLazyLoadOptions,
  LazyLoadState,
  LazyLoadActions,
  UseProgressiveRenderOptions,
  ProgressiveRenderState,
  ProgressiveRenderActions,
  UseChartPerformanceOptions,
  ChartPerformanceState,
  UsePerformanceMonitorOptions,
} from './hooks/usePerformance';
