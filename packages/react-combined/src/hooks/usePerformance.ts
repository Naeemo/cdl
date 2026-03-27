/**
 * CDL React 性能优化 Hooks
 * 简化版 - 提供虚拟滚动、懒加载、渐进渲染
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// 基础类型定义
export interface UseVirtualScrollOptions {
  totalCount: number;
  viewportSize: number;
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
  isVisible: boolean;
  hasLoaded: boolean;
}

export interface LazyLoadActions {
  ref: React.RefObject<HTMLElement>;
}

export interface UseProgressiveRenderOptions {
  stages: number;
  delay?: number;
}

export interface ProgressiveRenderState {
  currentStage: number;
  isComplete: boolean;
}

export interface ProgressiveRenderActions {
  nextStage: () => void;
  reset: () => void;
}

export interface UseChartPerformanceOptions {
  debounceMs?: number;
}

export interface ChartPerformanceState {
  renderTime: number;
  isOptimizing: boolean;
}

export interface UsePerformanceMonitorOptions {
  enabled?: boolean;
}

// ==================== 虚拟滚动 Hook ====================

export function useVirtualScroll(options: UseVirtualScrollOptions): VirtualScrollState {
  const { totalCount, viewportSize, bufferSize = 5, itemHeight, overscan = 2 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(viewportSize / itemHeight);
  const totalHeight = totalCount * itemHeight;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalCount, startIndex + visibleCount + overscan * 2);
  
  const visibleItems = useMemo(() => {
    const items: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push(i);
    }
    return items;
  }, [startIndex, endIndex]);
  
  const offsetY = startIndex * itemHeight;
  
  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
  };
}

// ==================== 懒加载 Hook ====================

export function useLazyLoad(options: UseLazyLoadOptions = {}): LazyLoadState & LazyLoadActions {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);
  
  return { isVisible, hasLoaded, ref: ref as React.RefObject<HTMLElement> };
}

// ==================== 渐进渲染 Hook ====================

export function useProgressiveRender(
  options: UseProgressiveRenderOptions
): ProgressiveRenderState & ProgressiveRenderActions {
  const { stages, delay = 100 } = options;
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (currentStage >= stages) {
      setIsComplete(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [currentStage, stages, delay]);
  
  const nextStage = useCallback(() => {
    setCurrentStage(prev => Math.min(prev + 1, stages));
  }, [stages]);
  
  const reset = useCallback(() => {
    setCurrentStage(0);
    setIsComplete(false);
  }, []);
  
  return { currentStage, isComplete, nextStage, reset };
}

// ==================== 图表性能 Hook ====================

export function useChartPerformance(
  options: UseChartPerformanceOptions = {}
): ChartPerformanceState {
  const { debounceMs = 100 } = options;
  const [renderTime, setRenderTime] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const startTimeRef = useRef<number>(0);
  
  const startMeasure = useCallback(() => {
    startTimeRef.current = performance.now();
    setIsOptimizing(true);
  }, []);
  
  const endMeasure = useCallback(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    
    setTimeout(() => {
      setRenderTime(duration);
      setIsOptimizing(false);
    }, debounceMs);
  }, [debounceMs]);
  
  return { renderTime, isOptimizing };
}

// ==================== 性能监控 Hook ====================

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): { fps: number; memory: number | null } {
  const { enabled = true } = options;
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState<number | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    
    const update = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
        
        // Memory info (Chrome only)
        if ('memory' in performance) {
          setMemory((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }
      }
      
      rafId = requestAnimationFrame(update);
    };
    
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);
  
  return { fps, memory };
}