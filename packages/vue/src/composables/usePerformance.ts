/**
 * CDL Vue 性能优化组合式函数（简化版）
 * 提供虚拟滚动、懒加载、渐进渲染
 */

import { ref, computed, watch, onUnmounted, shallowRef, triggerRef } from 'vue';
import type { Ref, ComputedRef } from 'vue';

// ==================== 类型定义 ====================

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
  visibleItems: number[];
  totalHeight: number;
  offsetY: number;
}

export interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

export interface LazyLoadState {
  isVisible: Ref<boolean>;
  hasLoaded: Ref<boolean>;
}

export interface UseProgressiveRenderOptions {
  stages: number;
  delay?: number;
}

export interface ProgressiveRenderState {
  currentStage: Ref<number>;
  isComplete: Ref<boolean>;
}

export interface UseChartPerformanceOptions {
  debounceMs?: number;
}

export interface ChartPerformanceState {
  renderTime: Ref<number>;
  isOptimizing: Ref<boolean>;
}

export interface UsePerformanceMonitorOptions {
  enabled?: boolean;
}

export interface PerformanceMonitorState {
  fps: Ref<number>;
  memory: Ref<number | null>;
}

export interface PerformanceMonitorActions {
  start: () => void;
  stop: () => void;
}

// ==================== 虚拟滚动 ====================

export function useVirtualScroll(options: UseVirtualScrollOptions): {
  state: ComputedRef<VirtualScrollState>;
  scrollTo: (index: number) => void;
} {
  const scrollTop = ref(0);
  
  const getTotalCount = () => 
    typeof options.totalCount === 'number' ? options.totalCount : options.totalCount.value;
  const getViewportSize = () => 
    typeof options.viewportSize === 'number' ? options.viewportSize : options.viewportSize.value;
  
  const state = computed<VirtualScrollState>(() => {
    const totalCount = getTotalCount();
    const viewportSize = getViewportSize();
    const itemHeight = options.itemHeight;
    const bufferSize = options.bufferSize ?? 5;
    const overscan = options.overscan ?? 2;
    
    const visibleCount = Math.ceil(viewportSize / itemHeight);
    const totalHeight = totalCount * itemHeight;
    
    const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan);
    const endIndex = Math.min(totalCount, startIndex + visibleCount + bufferSize + overscan * 2);
    
    const visibleItems: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      visibleItems.push(i);
    }
    
    const offsetY = startIndex * itemHeight;
    
    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
    };
  });

  const scrollTo = (index: number) => {
    scrollTop.value = index * options.itemHeight;
  };

  return { state, scrollTo };
}

// ==================== 懒加载 ====================

export function useLazyLoad(
  targetRef: Ref<HTMLElement | null>,
  options: UseLazyLoadOptions = {}
): LazyLoadState {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const isVisible = ref(false);
  const hasLoaded = ref(false);

  let observer: IntersectionObserver | null = null;

  const setupObserver = () => {
    if (!targetRef.value) return;

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          hasLoaded.value = true;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(targetRef.value);
  };

  watch(
    () => targetRef.value,
    (el) => {
      if (el) {
        setupObserver();
      } else {
        observer?.disconnect();
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { isVisible, hasLoaded };
}

// ==================== 渐进渲染 ====================

export function useProgressiveRender(
  options: UseProgressiveRenderOptions
): ProgressiveRenderState & {
  nextStage: () => void;
  reset: () => void;
} {
  const { stages, delay = 100 } = options;
  const currentStage = ref(0);
  const isComplete = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleNext = () => {
    if (currentStage.value >= stages) {
      isComplete.value = true;
      return;
    }

    timer = setTimeout(() => {
      currentStage.value++;
      scheduleNext();
    }, delay);
  };

  watch(
    () => stages,
    () => {
      currentStage.value = 0;
      isComplete.value = false;
      if (timer) clearTimeout(timer);
      scheduleNext();
    },
    { immediate: true }
  );

  const nextStage = () => {
    if (currentStage.value < stages) {
      currentStage.value++;
    }
  };

  const reset = () => {
    currentStage.value = 0;
    isComplete.value = false;
    if (timer) clearTimeout(timer);
    scheduleNext();
  };

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return { currentStage, isComplete, nextStage, reset };
}

// ==================== 图表性能 ====================

export function useChartPerformance(
  options: UseChartPerformanceOptions = {}
): ChartPerformanceState & {
  startMeasure: () => void;
  endMeasure: () => void;
} {
  const { debounceMs = 100 } = options;
  const renderTime = ref(0);
  const isOptimizing = ref(false);
  const startTimeRef = ref<number>(0);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const startMeasure = () => {
    startTimeRef.value = performance.now();
    isOptimizing.value = true;
  };

  const endMeasure = () => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.value;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderTime.value = duration;
      isOptimizing.value = false;
    }, debounceMs);
  };

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return { renderTime, isOptimizing, startMeasure, endMeasure };
}

// ==================== 性能监控 ====================

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): PerformanceMonitorState & PerformanceMonitorActions {
  const { enabled = true } = options;
  const fps = ref(60);
  const memory = ref<number | null>(null);
  let rafId: number | null = null;
  let isRunning = false;

  let frameCount = 0;
  let lastTime = performance.now();

  const update = () => {
    if (!isRunning) return;

    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;

      // Memory info (Chrome only)
      if ('memory' in performance) {
        memory.value = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
    }

    rafId = requestAnimationFrame(update);
  };

  const start = () => {
    if (isRunning || !enabled) return;
    isRunning = true;
    lastTime = performance.now();
    frameCount = 0;
    update();
  };

  const stop = () => {
    isRunning = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  watch(
    () => enabled,
    (value) => {
      if (value) {
        start();
      } else {
        stop();
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    stop();
  });

  return { fps, memory, start, stop };
}