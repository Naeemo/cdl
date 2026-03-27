// CDL React - All in one package
export { CDLChart } from './CDLChart';
export type { DrillDownPath, DetailData } from './CDLChart';

// Dynamic chart exports
export { DynamicCDLChart } from './dynamic/DynamicCDLChart';
export type { DynamicCDLChartProps } from './dynamic/DynamicCDLChart';

// Core hooks
export { useDynamicChart, useStreamingData } from './dynamic';
export type { 
  UseDynamicChartOptions, 
  UseDynamicChartReturn,
  UseStreamingDataOptions,
  UseStreamingDataReturn
} from './dynamic';

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

// Performance hooks
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

// Dynamic core types (embedded)
export type {
  DataSourceConfig,
  DataBatch,
  StreamStats,
  ChartDataState,
  ChartUpdateStrategy,
} from './core';

export { 
  DataStreamManager,
  ChartDataManager,
  defaultUpdateStrategy,
  timeSeriesUpdateStrategy,
} from './core';