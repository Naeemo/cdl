/**
 * CDL 性能优化模块主入口
 * 
 * 提供大数据集渲染优化能力：
 * - 数据抽样 (LTTB, Average, MinMax, Random)
 * - 虚拟滚动
 * - 懒加载
 * - 渐进渲染
 * - 数据聚合
 */

// 核心性能优化
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
  
  // 配置和类型
  DEFAULT_PERFORMANCE_CONFIG,
} from './performance-optimization';

// 渲染器集成
export {
  // 配置解析
  parsePerformanceHints,
  applyPerformanceOptimization,
  generateProgressiveConfig,
  generateDataZoomConfig,
  generateOptimizedTooltip,
  optimizeChartOption,
  createPerformanceStats,
  getOptimizationSuggestions,
  
  // 类型
  type ChartPerformanceHints,
} from './renderer-integration';

// 类型导出
export type {
  DataPoint as PerformanceDataPoint,
  SamplingOptions,
  VirtualScrollOptions,
  LazyLoadOptions,
  ProgressiveOptions,
  AggregationOptions,
  PerformanceConfig,
} from './performance-optimization';
