/**
 * CDL 大数据集性能优化模块
 * 
 * 核心功能：
 * 1. 数据抽样 - 大规模数据降采样以保持渲染性能
 * 2. 虚拟滚动 - 只渲染可视区域数据点
 * 3. 懒加载 - 按需加载数据分片
 * 4. 渐进渲染 - 分批渲染避免阻塞主线程
 * 5. 数据聚合 - 对密集数据进行聚合优化
 */

export interface DataPoint {
  [key: string]: any;
}

export interface SamplingOptions {
  /** 抽样方法：'lttb' | 'average' | 'minmax' | 'random' */
  method: 'lttb' | 'average' | 'minmax' | 'random';
  /** 目标数据点数量 */
  threshold: number;
  /** X轴字段名（用于时序数据） */
  xField?: string;
  /** Y轴字段名 */
  yField?: string;
}

export interface VirtualScrollOptions {
  /** 可视区域数据点数量 */
  viewportSize: number;
  /** 缓冲区大小（额外渲染的数据点） */
  bufferSize: number;
  /** 当前滚动位置 */
  scrollOffset: number;
  /** 总数据量 */
  totalCount: number;
}

export interface LazyLoadOptions {
  /** 每批加载的数据量 */
  batchSize: number;
  /** 已加载的批次索引 */
  loadedBatches: number;
  /** 是否启用预加载 */
  preloadEnabled: boolean;
  /** 预加载阈值（距离底部多少条数据时触发） */
  preloadThreshold: number;
}

export interface ProgressiveOptions {
  /** 每帧渲染的数据量 */
  frameSize: number;
  /** 渲染间隔（ms） */
  frameInterval: number;
  /** 是否启用渐进渲染 */
  enabled: boolean;
}

export interface AggregationOptions {
  /** 聚合方法：'sum' | 'avg' | 'max' | 'min' | 'count' */
  method: 'sum' | 'avg' | 'max' | 'min' | 'count';
  /** 时间窗口或数据点窗口大小 */
  windowSize: number;
  /** 分组字段 */
  groupBy?: string;
  /** X轴字段 */
  xField?: string;
  /** Y轴字段 */
  yField?: string;
}

export interface PerformanceConfig {
  /** 启用性能优化的数据点阈值 */
  enableThreshold: number;
  /** 抽样配置 */
  sampling?: SamplingOptions;
  /** 虚拟滚动配置 */
  virtualScroll?: VirtualScrollOptions;
  /** 懒加载配置 */
  lazyLoad?: LazyLoadOptions;
  /** 渐进渲染配置 */
  progressive?: ProgressiveOptions;
  /** 聚合配置 */
  aggregation?: AggregationOptions;
}

// 默认配置
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableThreshold: 5000,
  sampling: {
    method: 'lttb',
    threshold: 2000,
  },
  progressive: {
    enabled: true,
    frameSize: 500,
    frameInterval: 16, // ~60fps
  },
};

/**
 * Largest Triangle Three Buckets (LTTB) 抽样算法
 * 保留数据整体趋势的高质量降采样算法
 * 
 * @param data 原始数据数组
 * @param threshold 目标数据点数量
 * @param xField X轴字段名
 * @param yField Y轴字段名
 * @returns 抽样后的数据
 */
export function lttbSampling(
  data: DataPoint[],
  threshold: number,
  xField: string = 'x',
  yField: string = 'y'
): DataPoint[] {
  if (data.length <= threshold || threshold < 3) {
    return data;
  }

  const sampled: DataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);
  let a = 0; // 当前抽样点索引

  // 始终保留第一个点
  sampled.push(data[0]);

  for (let i = 1; i < threshold - 1; i++) {
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;
    const bucket = data.slice(bucketStart, bucketEnd);

    // 计算桶的平均点
    const avgX = bucket.reduce((sum, p) => sum + (Number(p[xField]) || 0), 0) / bucket.length;
    const avgY = bucket.reduce((sum, p) => sum + (Number(p[yField]) || 0), 0) / bucket.length;

    // 找到三角形面积最大的点
    let maxArea = -1;
    let maxIdx = bucketStart;

    for (let j = 0; j < bucket.length; j++) {
      const point = bucket[j];
      const x = Number(point[xField]) || 0;
      const y = Number(point[yField]) || 0;

      // 计算三角形面积 (0.5 * |x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|)
      const prevPoint = data[a];
      const prevX = Number(prevPoint[xField]) || 0;
      const prevY = Number(prevPoint[yField]) || 0;

      const area = Math.abs(
        (prevX - avgX) * (y - prevY) - (prevX - x) * (avgY - prevY)
      );

      if (area > maxArea) {
        maxArea = area;
        maxIdx = bucketStart + j;
      }
    }

    sampled.push(data[maxIdx]);
    a = maxIdx;
  }

  // 始终保留最后一个点
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * 平均值抽样 - 将数据分成桶，取每桶平均值
 */
export function averageSampling(
  data: DataPoint[],
  threshold: number,
  xField: string = 'x',
  yField: string = 'y'
): DataPoint[] {
  if (data.length <= threshold) return data;

  const bucketSize = Math.ceil(data.length / threshold);
  const sampled: DataPoint[] = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, Math.min(i + bucketSize, data.length));
    const avgX = bucket.reduce((sum, p) => sum + (Number(p[xField]) || 0), 0) / bucket.length;
    const avgY = bucket.reduce((sum, p) => sum + (Number(p[yField]) || 0), 0) / bucket.length;
    
    const newPoint: DataPoint = { ...bucket[0] };
    newPoint[xField] = avgX;
    newPoint[yField] = avgY;
    sampled.push(newPoint);
  }

  return sampled;
}

/**
 * Min-Max 抽样 - 保留每桶的最小和最大值
 * 适合保留极值特征的时序数据
 */
export function minMaxSampling(
  data: DataPoint[],
  threshold: number,
  xField: string = 'x',
  yField: string = 'y'
): DataPoint[] {
  if (data.length <= threshold) return data;

  const bucketSize = Math.ceil(data.length / (threshold / 2));
  const sampled: DataPoint[] = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, Math.min(i + bucketSize, data.length));
    let minPoint = bucket[0];
    let maxPoint = bucket[0];

    for (const point of bucket) {
      const y = Number(point[yField]) || 0;
      const minY = Number(minPoint[yField]) || 0;
      const maxY = Number(maxPoint[yField]) || 0;

      if (y < minY) minPoint = point;
      if (y > maxY) maxPoint = point;
    }

    // 按X排序后添加
    if (Number(minPoint[xField]) < Number(maxPoint[xField])) {
      sampled.push(minPoint, maxPoint);
    } else {
      sampled.push(maxPoint, minPoint);
    }
  }

  return sampled.sort((a, b) => Number(a[xField]) - Number(b[xField]));
}

/**
 * 随机抽样
 */
export function randomSampling(
  data: DataPoint[],
  threshold: number
): DataPoint[] {
  if (data.length <= threshold) return data;

  const indices = new Set<number>();
  while (indices.size < threshold) {
    indices.add(Math.floor(Math.random() * data.length));
  }

  return Array.from(indices).sort((a, b) => a - b).map(i => data[i]);
}

/**
 * 通用抽样接口
 */
export function sampleData(
  data: DataPoint[],
  options: SamplingOptions
): DataPoint[] {
  const { method, threshold, xField = 'x', yField = 'y' } = options;

  switch (method) {
    case 'lttb':
      return lttbSampling(data, threshold, xField, yField);
    case 'average':
      return averageSampling(data, threshold, xField, yField);
    case 'minmax':
      return minMaxSampling(data, threshold, xField, yField);
    case 'random':
      return randomSampling(data, threshold);
    default:
      return data;
  }
}

/**
 * 虚拟滚动 - 计算可视区域数据范围
 */
export function getVirtualScrollRange(
  options: VirtualScrollOptions
): { start: number; end: number; visibleData: number[] } {
  const { viewportSize, bufferSize, scrollOffset, totalCount } = options;
  
  const start = Math.max(0, scrollOffset - bufferSize);
  const end = Math.min(totalCount, scrollOffset + viewportSize + bufferSize);
  
  const visibleData: number[] = [];
  for (let i = start; i < end; i++) {
    visibleData.push(i);
  }

  return { start, end, visibleData };
}

/**
 * 数据聚合 - 时间窗口或数据点窗口聚合
 */
export function aggregateData(
  data: DataPoint[],
  options: AggregationOptions
): DataPoint[] {
  const { method, windowSize, xField = 'x', yField = 'y', groupBy } = options;

  if (groupBy) {
    // 按组分别聚合
    const groups = new Map<string, DataPoint[]>();
    data.forEach(point => {
      const key = String(point[groupBy] || 'default');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(point);
    });

    const result: DataPoint[] = [];
    groups.forEach((groupData, key) => {
      const aggregated = aggregateSingleGroup(groupData, method, windowSize, xField, yField);
      aggregated.forEach(p => p[groupBy] = key);
      result.push(...aggregated);
    });
    return result.sort((a, b) => Number(a[xField]) - Number(b[xField]));
  }

  return aggregateSingleGroup(data, method, windowSize, xField, yField);
}

function aggregateSingleGroup(
  data: DataPoint[],
  method: string,
  windowSize: number,
  xField: string,
  yField: string
): DataPoint[] {
  const result: DataPoint[] = [];

  for (let i = 0; i < data.length; i += windowSize) {
    const window = data.slice(i, Math.min(i + windowSize, data.length));
    const values = window.map(p => Number(p[yField]) || 0);

    let aggregatedValue: number;
    switch (method) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      default:
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
    }

    // 使用窗口中间点的X值
    const midPoint = window[Math.floor(window.length / 2)];
    const newPoint: DataPoint = { ...midPoint };
    newPoint[yField] = aggregatedValue;
    result.push(newPoint);
  }

  return result;
}

/**
 * 渐进渲染调度器
 */
export class ProgressiveRenderer {
  private options: ProgressiveOptions;
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(options: ProgressiveOptions) {
    this.options = options;
  }

  /**
   * 渐进渲染数据
   * @param data 完整数据
   * @param renderFn 渲染回调，接收当前批次数据
   * @param onComplete 完成回调
   */
  async render<T>(
    data: T[],
    renderFn: (batch: T[], progress: number) => void | Promise<void>,
    onComplete?: () => void
  ): Promise<void> {
    if (!this.options.enabled || data.length <= this.options.frameSize) {
      await renderFn(data, 100);
      onComplete?.();
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const total = data.length;
    let processed = 0;

    while (processed < total && !signal.aborted) {
      const end = Math.min(processed + this.options.frameSize, total);
      const batch = data.slice(processed, end);
      const progress = (end / total) * 100;

      await renderFn(batch, progress);

      processed = end;

      if (processed < total) {
        await this.sleep(this.options.frameInterval);
      }
    }

    this.isRunning = false;
    if (!signal.aborted) {
      onComplete?.();
    }
  }

  /**
   * 中止当前渲染
   */
  abort(): void {
    this.abortController?.abort();
    this.isRunning = false;
  }

  /**
   * 是否正在渲染
   */
  get running(): boolean {
    return this.isRunning;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 懒加载数据加载器
 */
export class LazyDataLoader<T> {
  private options: LazyLoadOptions;
  private cache = new Map<number, T[]>();
  private loading = new Set<number>();
  private dataProvider: (batchIndex: number, batchSize: number) => Promise<T[]>;

  constructor(
    options: LazyLoadOptions,
    dataProvider: (batchIndex: number, batchSize: number) => Promise<T[]>
  ) {
    this.options = options;
    this.dataProvider = dataProvider;
  }

  /**
   * 加载指定批次
   */
  async loadBatch(batchIndex: number): Promise<T[]> {
    if (this.cache.has(batchIndex)) {
      return this.cache.get(batchIndex)!;
    }

    if (this.loading.has(batchIndex)) {
      // 等待加载完成
      while (this.loading.has(batchIndex)) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return this.cache.get(batchIndex) || [];
    }

    this.loading.add(batchIndex);

    try {
      const data = await this.dataProvider(batchIndex, this.options.batchSize);
      this.cache.set(batchIndex, data);
      return data;
    } finally {
      this.loading.delete(batchIndex);
    }
  }

  /**
   * 预加载后续批次
   */
  preloadBatches(currentBatch: number, count: number = 2): void {
    if (!this.options.preloadEnabled) return;

    for (let i = 1; i <= count; i++) {
      const batchIndex = currentBatch + i;
      if (!this.cache.has(batchIndex)) {
        this.loadBatch(batchIndex).catch(() => {}); // 静默失败
      }
    }
  }

  /**
   * 检查是否需要加载更多
   */
  shouldLoadMore(currentIndex: number, totalLoaded: number): boolean {
    if (!this.options.preloadEnabled) return false;
    return totalLoaded - currentIndex < this.options.preloadThreshold;
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.loading.clear();
  }

  /**
   * 获取已缓存的数据总量
   */
  getCachedCount(): number {
    let count = 0;
    this.cache.forEach(data => count += data.length);
    return count;
  }
}

/**
 * 性能优化主入口
 * 根据配置自动选择合适的优化策略
 */
export function optimizeData(
  data: DataPoint[],
  config: Partial<PerformanceConfig> = {}
): {
  data: DataPoint[];
  samplingRatio: number;
  recommendations: string[];
} {
  const fullConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
  const recommendations: string[] = [];

  // 检查是否需要优化
  if (data.length < fullConfig.enableThreshold) {
    return {
      data,
      samplingRatio: 1,
      recommendations: ['数据量较小，无需优化'],
    };
  }

  let optimizedData = data;
  let samplingRatio = 1;

  // 1. 应用抽样
  if (fullConfig.sampling && data.length > fullConfig.sampling.threshold) {
    const beforeCount = data.length;
    optimizedData = sampleData(optimizedData, fullConfig.sampling);
    samplingRatio = optimizedData.length / beforeCount;
    recommendations.push(`应用 ${fullConfig.sampling.method} 抽样: ${beforeCount} -> ${optimizedData.length} 点`);
  }

  // 2. 应用聚合
  if (fullConfig.aggregation) {
    const beforeCount = optimizedData.length;
    optimizedData = aggregateData(optimizedData, fullConfig.aggregation);
    recommendations.push(`应用 ${fullConfig.aggregation.method} 聚合: ${beforeCount} -> ${optimizedData.length} 点`);
  }

  return {
    data: optimizedData,
    samplingRatio,
    recommendations,
  };
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures: { name: string; duration: number }[] = [];

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined) {
      console.warn(`Mark '${startMark}' not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;
    this.measures.push({ name, duration });
    return duration;
  }

  getMeasures(): { name: string; duration: number }[] {
    return [...this.measures];
  }

  clear(): void {
    this.marks.clear();
    this.measures = [];
  }

  report(): string {
    return this.measures
      .map(m => `${m.name}: ${m.duration.toFixed(2)}ms`)
      .join('\n');
  }
}

// 导出所有类型和工具
export {
  DataPoint as PerformanceDataPoint,
  SamplingOptions as PerformanceSamplingOptions,
  VirtualScrollOptions as PerformanceVirtualScrollOptions,
  LazyLoadOptions as PerformanceLazyLoadOptions,
  ProgressiveOptions as PerformanceProgressiveOptions,
  AggregationOptions as PerformanceAggregationOptions,
  PerformanceConfig as PerformanceOptimizationConfig,
};
