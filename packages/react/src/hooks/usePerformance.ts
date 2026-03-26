/**
 * CDL React 性能优化 Hooks
 * 
 * 提供虚拟滚动、懒加载、渐进渲染的 React 集成
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  VirtualScrollOptions,
  LazyLoadOptions,
  ProgressiveOptions,
  PerformanceDataPoint,
  getVirtualScrollRange,
  ProgressiveRenderer,
  LazyDataLoader,
  PerformanceMonitor,
  applyPerformanceOptimization,
  generateProgressiveConfig,
} from '@naeemo/cdl-renderer-echarts';

export interface UseVirtualScrollOptions {
  totalCount: number;
  viewportSize: number;
  bufferSize?: number;
  itemHeight: number;
  overscan?: number;
}

export interface VirtualScrollState {
  /** 可视区域起始索引 */
  startIndex: number;
  /** 可视区域结束索引 */
  endIndex: number;
  /** 可见数据项的索引列表 */
  visibleIndices: number[];
  /** 滚动偏移量 */
  scrollOffset: number;
  /** 容器总高度 */
  totalHeight: number;
  /** 可视区域偏移 */
  translateY: number;
}

/**
 * 虚拟滚动 Hook
 * 用于大数据集列表/图表的虚拟滚动
 */
export function useVirtualScroll(options: UseVirtualScrollOptions) {
  const {
    totalCount,
    viewportSize,
    bufferSize = 5,
    itemHeight,
    overscan = 3,
  } = options;

  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const state: VirtualScrollState = useMemo(() => {
    const totalHeight = totalCount * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
    const endIndex = Math.min(
      totalCount,
      startIndex + viewportSize + overscan * 2
    );

    const visibleIndices: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      visibleIndices.push(i);
    }

    return {
      startIndex,
      endIndex,
      visibleIndices,
      scrollOffset,
      totalHeight,
      translateY: startIndex * itemHeight,
    };
  }, [scrollOffset, totalCount, viewportSize, itemHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollOffset(target.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  return {
    containerRef,
    state,
    handleScroll,
    scrollToIndex,
  };
}

export interface UseLazyLoadOptions<T> {
  /** 数据加载函数 */
  fetchData: (start: number, count: number) => Promise<T[]>;
  /** 总数据量（可选，未知时为 undefined） */
  totalCount?: number;
  /** 每批加载数量 */
  batchSize?: number;
  /** 预加载阈值 */
  preloadThreshold?: number;
  /** 是否启用预加载 */
  preloadEnabled?: boolean;
}

export interface LazyLoadState<T> {
  /** 已加载的数据 */
  data: T[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 已加载数量 */
  loadedCount: number;
}

export interface LazyLoadActions {
  /** 加载下一批 */
  loadMore: () => Promise<void>;
  /** 重新加载 */
  reload: () => Promise<void>;
  /** 检查是否需要加载更多 */
  checkAndLoad: (visibleIndex: number) => void;
}

/**
 * 懒加载 Hook
 * 用于大数据集的按需加载
 */
export function useLazyLoad<T>(options: UseLazyLoadOptions<T>): [LazyLoadState<T>, LazyLoadActions] {
  const {
    fetchData,
    totalCount,
    batchSize = 100,
    preloadThreshold = 20,
    preloadEnabled = true,
  } = options;

  const [state, setState] = useState<LazyLoadState<T>>({
    data: [],
    loading: false,
    hasMore: true,
    error: null,
    loadedCount: 0,
  });

  const loaderRef = useRef<LazyDataLoader<T> | null>(null);
  const loadingRef = useRef(false);

  // 初始化 loader
  useEffect(() => {
    loaderRef.current = new LazyDataLoader<T>(
      {
        batchSize,
        loadedBatches: 0,
        preloadEnabled,
        preloadThreshold,
      },
      async (batchIndex: number, size: number) => {
        const start = batchIndex * size;
        return fetchData(start, size);
      }
    );

    return () => {
      loaderRef.current?.clearCache();
    };
  }, [fetchData, batchSize, preloadEnabled, preloadThreshold]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return;

    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const batchIndex = Math.floor(state.loadedCount / batchSize);
      const newData = await loaderRef.current?.loadBatch(batchIndex) || [];

      if (newData.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          hasMore: false,
        }));
      } else {
        setState(prev => {
          const updatedData = [...prev.data, ...newData];
          const loadedCount = updatedData.length;
          const hasMore = totalCount === undefined || loadedCount < totalCount;

          return {
            data: updatedData,
            loading: false,
            hasMore,
            error: null,
            loadedCount,
          };
        });
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [state.hasMore, state.loadedCount, batchSize, totalCount]);

  const reload = useCallback(async () => {
    loaderRef.current?.clearCache();
    setState({
      data: [],
      loading: false,
      hasMore: true,
      error: null,
      loadedCount: 0,
    });
    await loadMore();
  }, [loadMore]);

  const checkAndLoad = useCallback((visibleIndex: number) => {
    if (preloadEnabled && state.hasMore && !state.loading) {
      const remaining = state.loadedCount - visibleIndex;
      if (remaining < preloadThreshold) {
        loadMore();
      }
    }
  }, [preloadEnabled, state.hasMore, state.loading, state.loadedCount, preloadThreshold, loadMore]);

  return [state, { loadMore, reload, checkAndLoad }];
}

export interface UseProgressiveRenderOptions {
  /** 总数据量 */
  totalCount: number;
  /** 每帧渲染数量 */
  frameSize?: number;
  /** 帧间隔（ms） */
  frameInterval?: number;
}

export interface ProgressiveRenderState<T> {
  /** 已渲染的数据 */
  renderedData: T[];
  /** 渲染进度 (0-100) */
  progress: number;
  /** 是否正在渲染 */
  isRendering: boolean;
  /** 是否完成 */
  isComplete: boolean;
}

export interface ProgressiveRenderActions {
  /** 开始渲染 */
  start: (data: any[]) => void;
  /** 中止渲染 */
  abort: () => void;
}

/**
 * 渐进渲染 Hook
 * 用于大数据集的分批渲染，避免阻塞主线程
 */
export function useProgressiveRender<T>(
  options: UseProgressiveRenderOptions
): [ProgressiveRenderState<T>, ProgressiveRenderActions] {
  const { frameSize = 500, frameInterval = 16 } = options;

  const [state, setState] = useState<ProgressiveRenderState<T>>({
    renderedData: [],
    progress: 0,
    isRendering: false,
    isComplete: false,
  });

  const rendererRef = useRef<ProgressiveRenderer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    rendererRef.current = new ProgressiveRenderer({
      enabled: true,
      frameSize,
      frameInterval,
    });

    return () => {
      rendererRef.current?.abort();
    };
  }, [frameSize, frameInterval]);

  const start = useCallback((data: T[]) => {
    // 重置状态
    setState({
      renderedData: [],
      progress: 0,
      isRendering: true,
      isComplete: false,
    });

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    rendererRef.current?.render<T>(
      data,
      (batch: T[], progress: number) => {
        if (signal.aborted) return;
        
        setState(prev => ({
          ...prev,
          renderedData: [...prev.renderedData, ...batch],
          progress,
        }));
      },
      () => {
        if (signal.aborted) return;
        
        setState(prev => ({
          ...prev,
          isRendering: false,
          isComplete: true,
          progress: 100,
        }));
      }
    );
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    rendererRef.current?.abort();
    setState(prev => ({
      ...prev,
      isRendering: false,
    }));
  }, []);

  return [state, { start, abort }];
}

export interface UseChartPerformanceOptions {
  /** 原始数据 */
  data: PerformanceDataPoint[];
  /** X轴字段 */
  xField: string;
  /** Y轴字段 */
  yField: string;
  /** 分组字段 */
  groupBy?: string;
  /** 性能优化配置 */
  performanceHints?: {
    enabled?: boolean | 'auto';
    threshold?: number;
    sampling?: 'lttb' | 'average' | 'minmax' | 'random' | 'none';
    maxPoints?: number;
    progressive?: boolean;
    progressiveChunk?: number;
  };
}

export interface ChartPerformanceState {
  /** 优化后的数据 */
  optimizedData: PerformanceDataPoint[];
  /** 是否已优化 */
  isOptimized: boolean;
  /** 优化信息 */
  info: {
    originalCount: number;
    optimizedCount: number;
    samplingRatio: number;
    methods: string[];
  };
  /** ECharts 配置 */
  echartsConfig: {
    progressive?: number;
    progressiveThreshold?: number;
    animation?: boolean;
  };
}

/**
 * 图表性能优化 Hook
 * 整合了数据抽样和渲染优化的完整解决方案
 */
export function useChartPerformance(options: UseChartPerformanceOptions): ChartPerformanceState {
  const { data, xField, yField, groupBy, performanceHints } = options;

  return useMemo(() => {
    const result = applyPerformanceOptimization(
      data,
      performanceHints || {},
      xField,
      yField,
      groupBy
    );

    const echartsConfig = generateProgressiveConfig(
      performanceHints || {},
      result.optimizationInfo.optimizedCount
    );

    return {
      optimizedData: result.data,
      isOptimized: result.isOptimized,
      info: result.optimizationInfo,
      echartsConfig,
    };
  }, [data, xField, yField, groupBy, performanceHints]);
}

export interface UsePerformanceMonitorOptions {
  /** 是否自动报告 */
  autoReport?: boolean;
  /** 报告间隔（ms） */
  reportInterval?: number;
}

/**
 * 性能监控 Hook
 * 监控渲染性能并生成报告
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { autoReport = false, reportInterval = 5000 } = options;
  const monitorRef = useRef(new PerformanceMonitor());

  const mark = useCallback((name: string) => {
    monitorRef.current.mark(name);
  }, []);

  const measure = useCallback((name: string, startMark: string, endMark?: string) => {
    return monitorRef.current.measure(name, startMark, endMark);
  }, []);

  const getReport = useCallback(() => {
    return monitorRef.current.report();
  }, []);

  const clear = useCallback(() => {
    monitorRef.current.clear();
  }, []);

  useEffect(() => {
    if (!autoReport) return;

    const interval = setInterval(() => {
      const report = monitorRef.current.report();
      if (report) {
        console.log('[Performance Monitor]', report);
      }
    }, reportInterval);

    return () => clearInterval(interval);
  }, [autoReport, reportInterval]);

  return {
    mark,
    measure,
    getReport,
    clear,
    getMeasures: () => monitorRef.current.getMeasures(),
  };
}

// 类型导出
export type {
  VirtualScrollOptions,
  LazyLoadOptions,
  ProgressiveOptions,
  PerformanceDataPoint,
};
