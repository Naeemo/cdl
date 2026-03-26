/**
 * CDL Vue 包入口
 */

// 组件
// 注意：CDLChart.vue 需要在 vite 构建后才能正确导入
// export { default as CDLChart } from './CDLChart.vue';

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
