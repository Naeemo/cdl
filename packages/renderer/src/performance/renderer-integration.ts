/**
 * CDL 渲染器性能优化集成模块
 * 
 * 将性能优化功能集成到 ECharts 渲染流程中
 */

import {
  optimizeData,
  sampleData,
  aggregateData,
  ProgressiveRenderer,
  LazyDataLoader,
  PerformanceMonitor,
  PerformanceConfig,
  DEFAULT_PERFORMANCE_CONFIG,
  SamplingOptions,
  AggregationOptions,
  ProgressiveOptions,
  VirtualScrollOptions,
  DataPoint,
} from './performance-optimization';

export interface ChartPerformanceHints {
  /** 是否启用性能优化 */
  enabled?: boolean | 'auto';
  /** 数据点阈值，超过此值启用优化 */
  threshold?: number;
  /** 抽样方法 */
  sampling?: 'lttb' | 'average' | 'minmax' | 'random' | 'none';
  /** 抽样后最大数据点数 */
  maxPoints?: number;
  /** 聚合方法 */
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count' | 'none';
  /** 聚合窗口大小 */
  aggregationWindow?: number;
  /** 渐进渲染 */
  progressive?: boolean;
  /** 每帧渲染数据量 */
  progressiveChunk?: number;
  /** 虚拟滚动 */
  virtualScroll?: boolean;
  /** 可视区域数据点数 */
  viewportSize?: number;
  /** 懒加载 */
  lazyLoad?: boolean;
  /** 每批加载数据量 */
  batchSize?: number;
}

/**
 * 解析 hints 中的性能配置
 */
export function parsePerformanceHints(
  hints: Record<string, any> | undefined
): ChartPerformanceHints {
  if (!hints) return {};

  return {
    enabled: hints.performance as boolean | 'auto' | undefined,
    threshold: hints.performanceThreshold ? parseInt(hints.performanceThreshold, 10) : undefined,
    sampling: hints.sampling as any,
    maxPoints: hints.maxPoints ? parseInt(hints.maxPoints, 10) : undefined,
    aggregation: hints.aggregation as any,
    aggregationWindow: hints.aggregationWindow ? parseInt(hints.aggregationWindow, 10) : undefined,
    progressive: hints.progressive === 'true' || hints.progressive === true,
    progressiveChunk: hints.progressiveChunk ? parseInt(hints.progressiveChunk, 10) : undefined,
    virtualScroll: hints.virtualScroll === 'true' || hints.virtualScroll === true,
    viewportSize: hints.viewportSize ? parseInt(hints.viewportSize, 10) : undefined,
    lazyLoad: hints.lazyLoad === 'true' || hints.lazyLoad === true,
    batchSize: hints.batchSize ? parseInt(hints.batchSize, 10) : undefined,
  };
}

/**
 * 应用性能优化到图表数据
 */
export function applyPerformanceOptimization(
  data: DataPoint[],
  hints: ChartPerformanceHints,
  xField: string = 'x',
  yField: string = 'y',
  groupBy?: string
): {
  data: DataPoint[];
  isOptimized: boolean;
  optimizationInfo: {
    originalCount: number;
    optimizedCount: number;
    samplingRatio: number;
    methods: string[];
  };
} {
  const monitor = new PerformanceMonitor();
  monitor.mark('optimization-start');

  const originalCount = data.length;
  const methods: string[] = [];

  // 判断是否启用优化
  const enabled = hints.enabled === true || 
    (hints.enabled === 'auto' && originalCount > (hints.threshold || 5000));

  if (!enabled || originalCount === 0) {
    return {
      data,
      isOptimized: false,
      optimizationInfo: {
        originalCount,
        optimizedCount: originalCount,
        samplingRatio: 1,
        methods: [],
      },
    };
  }

  let optimizedData = [...data];

  // 1. 抽样优化
  if (hints.sampling && hints.sampling !== 'none') {
    const samplingOptions: SamplingOptions = {
      method: hints.sampling,
      threshold: hints.maxPoints || Math.min(2000, Math.max(500, Math.floor(originalCount * 0.2))),
      xField,
      yField,
    };

    monitor.mark('sampling-start');
    optimizedData = sampleData(optimizedData, samplingOptions);
    monitor.measure('sampling', 'sampling-start');

    methods.push(`sampling:${hints.sampling}`);
  }

  // 2. 聚合优化
  if (hints.aggregation && hints.aggregation !== 'none') {
    const aggregationOptions: AggregationOptions = {
      method: hints.aggregation,
      windowSize: hints.aggregationWindow || Math.ceil(originalCount / 100),
      xField,
      yField,
      groupBy,
    };

    monitor.mark('aggregation-start');
    optimizedData = aggregateData(optimizedData, aggregationOptions);
    monitor.measure('aggregation', 'aggregation-start');

    methods.push(`aggregation:${hints.aggregation}`);
  }

  monitor.measure('total-optimization', 'optimization-start');

  const optimizedCount = optimizedData.length;
  const samplingRatio = optimizedCount / originalCount;

  // 打印性能报告
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CDL Performance]', monitor.report());
  }

  return {
    data: optimizedData,
    isOptimized: true,
    optimizationInfo: {
      originalCount,
      optimizedCount,
      samplingRatio,
      methods,
    },
  };
}

/**
 * 生成 ECharts 渐进渲染配置
 */
export function generateProgressiveConfig(
  hints: ChartPerformanceHints,
  dataLength: number
): { progressive?: number; progressiveThreshold?: number; animation?: boolean } {
  if (!hints.progressive || dataLength < (hints.progressiveChunk || 500)) {
    return {};
  }

  return {
    progressive: hints.progressiveChunk || 500,
    progressiveThreshold: (hints.progressiveChunk || 500) * 2,
    animation: false, // 渐进渲染时禁用动画
  };
}

/**
 * 生成 ECharts dataZoom 配置（用于大数据集交互）
 */
export function generateDataZoomConfig(
  hints: ChartPerformanceHints,
  dataLength: number
): any[] | undefined {
  // 大数据集默认启用 dataZoom
  if (dataLength < 100) return undefined;

  const configs: any[] = [
    {
      type: 'inside',
      xAxisIndex: 0,
      start: Math.max(0, 100 - (100000 / dataLength)),
      end: 100,
      zoomOnMouseWheel: true,
      moveOnMouseWheel: true,
    },
  ];

  // 超过阈值显示滑动条
  if (dataLength > (hints.threshold || 5000)) {
    configs.push({
      type: 'slider',
      xAxisIndex: 0,
      start: Math.max(0, 100 - (100000 / dataLength)),
      end: 100,
      bottom: 10,
      height: 20,
      handleSize: '80%',
      showDetail: false,
    });
  }

  return configs;
}

/**
 * 生成大数据集 tooltip 优化配置
 */
export function generateOptimizedTooltip(
  hints: ChartPerformanceHints,
  dataLength: number
): any {
  const base = {
    trigger: 'axis' as const,
    axisPointer: {
      type: 'cross' as const,
      animation: false,
      label: { backgroundColor: '#6a7985' },
    },
  };

  // 大数据集优化
  if (dataLength > 10000) {
    return {
      ...base,
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'line' as const,
        lineStyle: {
          type: 'dashed',
        },
      },
      // 限制 tooltip 渲染的数据点
      formatter: (params: any[]) => {
        if (params.length > 10) {
          // 只显示前10个
          const limited = params.slice(0, 10);
          const more = params.length - 10;
          return limited.map(p => `${p.marker} ${p.seriesName}: ${p.value}`).join('<br/>') +
            `<br/>... 还有 ${more} 项`;
        }
        return params.map(p => `${p.marker} ${p.seriesName}: ${p.value}`).join('<br/>');
      },
    };
  }

  return base;
}

/**
 * 大数据集渲染优化包装器
 * 自动应用所有适用的优化策略
 */
export function optimizeChartOption(
  option: any,
  hints: ChartPerformanceHints,
  dataInfo: { dataLength: number; xField: string; yField: string; groupBy?: string }
): any {
  const { dataLength, xField, yField, groupBy } = dataInfo;

  if (!hints.enabled || (hints.enabled === 'auto' && dataLength < (hints.threshold || 5000))) {
    return option;
  }

  const optimizedOption = { ...option };

  // 1. 渐进渲染
  const progressiveConfig = generateProgressiveConfig(hints, dataLength);
  Object.assign(optimizedOption, progressiveConfig);

  // 2. DataZoom
  const dataZoomConfig = generateDataZoomConfig(hints, dataLength);
  if (dataZoomConfig) {
    optimizedOption.dataZoom = dataZoomConfig;
  }

  // 3. Tooltip 优化
  optimizedOption.tooltip = generateOptimizedTooltip(hints, dataLength);

  // 4. 动画优化
  if (dataLength > 5000) {
    optimizedOption.animation = hints.progressive ? false : {
      duration: 300,
      easing: 'linear',
    };
  }

  // 5. 系列级别优化
  if (optimizedOption.series && Array.isArray(optimizedOption.series)) {
    optimizedOption.series = optimizedOption.series.map((s: any) => ({
      ...s,
      // 大数据集禁用一些视觉效果
      ...(dataLength > 10000 ? {
        showSymbol: false,
        sampling: 'lttb',
      } : {}),
      ...(dataLength > 50000 ? {
        hoverAnimation: false,
        legendHoverLink: false,
      } : {}),
    }));
  }

  return optimizedOption;
}

/**
 * 渲染统计信息组件
 */
export function createPerformanceStats(
  optimizationInfo: {
    originalCount: number;
    optimizedCount: number;
    samplingRatio: number;
    methods: string[];
  }
): any {
  const { originalCount, optimizedCount, samplingRatio, methods } = optimizationInfo;

  return {
    type: 'text',
    left: 'right',
    top: 10,
    style: {
      text: `数据: ${optimizedCount.toLocaleString()}/${originalCount.toLocaleString()} (${(samplingRatio * 100).toFixed(1)}%)\n优化: ${methods.join(', ') || '无'}`,
      fontSize: 10,
      fill: '#999',
    },
    z: 100,
  };
}

/**
 * 自动优化建议
 */
export function getOptimizationSuggestions(
  dataLength: number,
  chartType: string
): string[] {
  const suggestions: string[] = [];

  if (dataLength > 100000) {
    suggestions.push('数据量超过 10 万，强烈建议启用服务端聚合');
    suggestions.push('考虑使用数据仓库或 OLAP 引擎预处理数据');
  } else if (dataLength > 10000) {
    suggestions.push('数据量超过 1 万，建议启用 LTTB 抽样');
    suggestions.push('启用渐进渲染提升首屏体验');
  } else if (dataLength > 5000) {
    suggestions.push('数据量较大，建议启用性能优化');
  }

  if (['line', 'area'].includes(chartType) && dataLength > 5000) {
    suggestions.push('折线图建议启用 dataZoom 支持缩放');
  }

  if (chartType === 'scatter' && dataLength > 10000) {
    suggestions.push('散点图大数据集建议使用聚合或热力图替代');
  }

  return suggestions;
}

// 导出所有性能优化工具
export {
  optimizeData,
  sampleData,
  aggregateData,
  ProgressiveRenderer,
  LazyDataLoader,
  PerformanceMonitor,
  PerformanceConfig,
  DEFAULT_PERFORMANCE_CONFIG,
  SamplingOptions,
  AggregationOptions,
  ProgressiveOptions,
  VirtualScrollOptions,
  DataPoint,
};
