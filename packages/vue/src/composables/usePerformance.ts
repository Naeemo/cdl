/**
 * CDL Vue 性能优化组合式函数
 * 
 * 提供与 React hooks 类似的性能优化能力
 */

import { 
  ref, 
  computed, 
  watch, 
  onUnmounted,
  shallowRef,
  triggerRef,
} from 'vue';
import type { Ref, ComputedRef } from 'vue';

// 导入性能优化核心功能
import {
  VirtualScrollOptions,
  LazyLoadOptions,
  ProgressiveOptions,
  PerformanceDataPoint,
  getVirtualScrollRange,
  ProgressiveRenderer,
  LazyDataLoader,
  PerformanceMonitor,
} from '@naeemo/cdl-renderer-echarts';

export interface UseVirtualScrollOptions {
  totalCount: Ref<number> | number;
  viewportSize: Ref<number> | number;
  bufferSize?: number;
  itemHeight: number;
  overscan?: number;
}

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  visibleIndices: number[];
  scrollOffset: number;
  totalHeight: number;
  translateY: number;
}

/**
 * Vue 虚拟滚动组合式函数
 */
export function useVirtualScroll(options: UseVirtualScrollOptions) {
  const totalCount = computed(() => 
    typeof options.totalCount === 'number' ? options.totalCount : options.totalCount.value
  );
  const viewportSize = computed(() => 
    typeof options.viewportSize === 'number' ? options.viewportSize : options.viewportSize.value
  );
  const bufferSize = options.bufferSize ?? 5;
  const itemHeight = options.itemHeight;
  const overscan = options.overscan ?? 3;

  const scrollOffset = ref(0);

  const state = computed<VirtualScrollState>(() => {
    const totalHeight = totalCount.value * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollOffset.value / itemHeight) - overscan);
    const endIndex = Math.min(
      totalCount.value,
      startIndex + viewportSize.value + overscan * 2
    );

    const visibleIndices: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      visibleIndices.push(i);
    }

    return {
      startIndex,
      endIndex,
      visibleIndices,
      scrollOffset: scrollOffset.value,
      totalHeight,
      translateY: startIndex * itemHeight,
    };
  });

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    scrollOffset.value = target.scrollTop;
  };

  const scrollToIndex = (index: number, containerEl?: HTMLElement) => {
    const el = containerEl || document.querySelector('.cdl-virtual-scroll-container');
    if (el) {
      el.scrollTop = index * itemHeight;
    }
  };

  return {
    state,
    scrollOffset,
    handleScroll,
    scrollToIndex,
  };
}

export interface UseLazyLoadOptions<T> {
  fetchData: (start: number, count: number) => Promise<T[]>;
  totalCount?: Ref<number | undefined> | number;
  batchSize?: number;
  preloadThreshold?: number;
  preloadEnabled?: boolean;
}

export interface LazyLoadState<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadedCount: number;
}

/**
 * Vue 懒加载组合式函数
 */
export function useLazyLoad<T>(options: UseLazyLoadOptions<T>) {
  const {
    fetchData,
    totalCount,
    batchSize = 100,
    preloadThreshold = 20,
    preloadEnabled = true,
  } = options;

  const data = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const hasMore = ref(true);
  const error = ref<Error | null>(null);
  const loadedCount = computed(() => data.value.length);

  const loader = shallowRef<LazyDataLoader<T> | null>(null);
  const loadingLock = ref(false);

  // 初始化 loader
  onUnmounted(() => {
    loader.value?.clearCache();
  });

  const initializeLoader = () => {
    loader.value = new LazyDataLoader(
      {
        batchSize,
        loadedBatches: 0,
        preloadEnabled,
        preloadThreshold,
      },
      async (batchIndex, size) => {
        const start = batchIndex * size;
        return fetchData(start, size);
      }
    );
  };

  const loadMore = async () => {
    if (loadingLock.value || !hasMore.value) return;

    loadingLock.value = true;
    loading.value = true;
    error.value = null;

    try {
      if (!loader.value) {
        initializeLoader();
      }

      const batchIndex = Math.floor(data.value.length / batchSize);
      const newData = await loader.value?.loadBatch(batchIndex) || [];

      if (newData.length === 0) {
        hasMore.value = false;
      } else {
        data.value = [...data.value, ...newData];
        
        const total = typeof totalCount === 'number' ? totalCount : totalCount?.value;
        if (total !== undefined) {
          hasMore.value = data.value.length < total;
        }
      }
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
      loadingLock.value = false;
    }
  };

  const reload = async () => {
    loader.value?.clearCache();
    data.value = [];
    hasMore.value = true;
    error.value = null;
    await loadMore();
  };

  const checkAndLoad = (visibleIndex: number) => {
    if (preloadEnabled && hasMore.value && !loading.value) {
      const remaining = data.value.length - visibleIndex;
      if (remaining < preloadThreshold) {
        loadMore();
      }
    }
  };

  return {
    data: readonly(data),
    loading: readonly(loading),
    hasMore: readonly(hasMore),
    error: readonly(error),
    loadedCount,
    loadMore,
    reload,
    checkAndLoad,
  };
}

export interface UseProgressiveRenderOptions {
  totalCount: Ref<number> | number;
  frameSize?: number;
  frameInterval?: number;
}

export interface ProgressiveRenderState<T> {
  renderedData: T[];
  progress: number;
  isRendering: boolean;
  isComplete: boolean;
}

/**
 * Vue 渐进渲染组合式函数
 */
export function useProgressiveRender<T>(options: UseProgressiveRenderOptions) {
  const { frameSize = 500, frameInterval = 16 } = options;

  const renderedData = ref<T[]>([]) as Ref<T[]>;
  const progress = ref(0);
  const isRendering = ref(false);
  const isComplete = ref(false);

  const renderer = shallowRef<ProgressiveRenderer | null>(null);

  onUnmounted(() => {
    renderer.value?.abort();
  });

  const start = async (sourceData: T[]) => {
    // 重置状态
    renderedData.value = [];
    progress.value = 0;
    isRendering.value = true;
    isComplete.value = false;

    if (!renderer.value) {
      renderer.value = new ProgressiveRenderer({
        enabled: true,
        frameSize,
        frameInterval,
      });
    }

    await renderer.value.render<T>(
      sourceData,
      (batch, p) => {
        renderedData.value = [...renderedData.value, ...batch];
        progress.value = p;
      },
      () => {
        isRendering.value = false;
        isComplete.value = true;
        progress.value = 100;
      }
    );
  };

  const abort = () => {
    renderer.value?.abort();
    isRendering.value = false;
  };

  return {
    renderedData: readonly(renderedData),
    progress: readonly(progress),
    isRendering: readonly(isRendering),
    isComplete: readonly(isComplete),
    start,
    abort,
  };
}

import { readonly } from 'vue';

// 从 renderer 导入类型
import type {
  ChartPerformanceHints,
} from '@naeemo/cdl-renderer-echarts';

export interface UseChartPerformanceOptions {
  data: Ref<PerformanceDataPoint[]> | PerformanceDataPoint[];
  xField: string;
  yField: string;
  groupBy?: string;
  performanceHints?: ChartPerformanceHints;
}

export interface ChartPerformanceState {
  optimizedData: ComputedRef<PerformanceDataPoint[]>;
  isOptimized: ComputedRef<boolean>;
  info: ComputedRef<{
    originalCount: number;
    optimizedCount: number;
    samplingRatio: number;
    methods: string[];
  }>;
  echartsConfig: ComputedRef<{
    progressive?: number;
    progressiveThreshold?: number;
    animation?: boolean;
  }>;
}

/**
 * Vue 图表性能优化组合式函数
 */
export function useChartPerformance(options: UseChartPerformanceOptions): ChartPerformanceState {
  const { xField, yField, groupBy, performanceHints } = options;
  
  const dataRef = computed(() => 
    Array.isArray(options.data) ? options.data : options.data.value
  );

  const result = computed(() => {
    // 动态导入以避免循环依赖
    const { applyPerformanceOptimization, generateProgressiveConfig } = 
      require('@naeemo/cdl-renderer-echarts');

    return applyPerformanceOptimization(
      dataRef.value,
      performanceHints || {},
      xField,
      yField,
      groupBy
    );
  });

  const optimizedData = computed(() => result.value.data);
  const isOptimized = computed(() => result.value.isOptimized);
  const info = computed(() => result.value.optimizationInfo);

  const echartsConfig = computed(() => {
    const { generateProgressiveConfig } = require('@naeemo/cdl-renderer-echarts');
    return generateProgressiveConfig(
      performanceHints || {},
      info.value.optimizedCount
    );
  });

  return {
    optimizedData,
    isOptimized,
    info,
    echartsConfig,
  };
}

export interface UsePerformanceMonitorOptions {
  autoReport?: boolean;
  reportInterval?: number;
}

export interface PerformanceMonitorState {
  measures: Ref<Array<{ name: string; duration: number }>>;
}

export interface PerformanceMonitorActions {
  mark: (name: string) => void;
  measure: (name: string, startMark: string, endMark?: string) => number;
  getReport: () => string;
  clear: () => void;
}

/**
 * Vue 性能监控组合式函数
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): PerformanceMonitorActions {
  const { autoReport = false, reportInterval = 5000 } = options;

  const monitor = shallowRef(new PerformanceMonitor());

  const mark = (name: string) => {
    monitor.value.mark(name);
  };

  const measure = (name: string, startMark: string, endMark?: string) => {
    return monitor.value.measure(name, startMark, endMark);
  };

  const getReport = () => {
    return monitor.value.report();
  };

  const clear = () => {
    monitor.value.clear();
  };

  // 自动报告
  if (autoReport) {
    const interval = setInterval(() => {
      const report = monitor.value.report();
      if (report) {
        console.log('[Performance Monitor]', report);
      }
    }, reportInterval);

    onUnmounted(() => {
      clearInterval(interval);
    });
  }

  return {
    mark,
    measure,
    getReport,
    clear,
  };
}
