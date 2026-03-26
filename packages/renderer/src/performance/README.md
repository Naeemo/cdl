# CDL 性能优化模块

CDL 性能优化模块提供大数据集渲染的性能优化能力，包括数据抽样、虚拟滚动、懒加载和渐进渲染等功能。

## 功能特性

### 1. 数据抽样算法

支持多种降采样算法，在保持数据趋势的同时大幅减少渲染数据量：

- **LTTB (Largest Triangle Three Buckets)** - 默认算法，在保持趋势的同时最大程度保留视觉特征
- **Average** - 平均值抽样，适合平稳数据
- **MinMax** - 极值抽样，保留极值点，适合波动大的数据
- **Random** - 随机抽样，适合均匀分布数据

### 2. 虚拟滚动

只渲染可视区域的数据点，适用于超长列表或时间轴图表。

### 3. 懒加载

按需分批加载数据，支持预加载和缓存管理。

### 4. 渐进渲染

分批渲染大数据集，避免阻塞主线程，提供流畅的用户体验。

### 5. 数据聚合

按时间窗口或数据点窗口进行聚合计算（sum/avg/max/min/count）。

## 使用方式

### 在 CDL 语法中使用

```cdl
Chart 大数据折线图 {
    use LargeDataset
    type line
    x timestamp
    y value
    
    // 启用性能优化
    @hint "performance=true"
    @hint "sampling=lttb"
    @hint "maxPoints=2000"
    @hint "progressive=true"
}
```

### 支持的 Hints

| Hint | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| performance | boolean/"auto" | "auto" | 是否启用性能优化 |
| performanceThreshold | number | 5000 | 启用优化的数据点阈值 |
| sampling | "lttb"/"average"/"minmax"/"random"/"none" | "lttb" | 抽样方法 |
| maxPoints | number | 2000 | 抽样后最大数据点数 |
| aggregation | "sum"/"avg"/"max"/"min"/"count"/"none" | "none" | 聚合方法 |
| aggregationWindow | number | 10 | 聚合窗口大小 |
| progressive | boolean | false | 启用渐进渲染 |
| progressiveChunk | number | 500 | 每帧渲染数据量 |

### 在 JavaScript/TypeScript 中使用

```typescript
import { 
  optimizeData, 
  lttbSampling,
  applyPerformanceOptimization,
} from '@naeemo/cdl-renderer';

// 方法1: 使用 optimizeData（推荐）
const result = optimizeData(largeDataset, {
  enableThreshold: 5000,
  sampling: {
    method: 'lttb',
    threshold: 2000,
    xField: 'timestamp',
    yField: 'value',
  },
});

console.log(result.recommendations);
console.log(result.samplingRatio);
const optimizedData = result.data;

// 方法2: 使用单个抽样函数
const sampled = lttbSampling(data, 1000, 'x', 'y');

// 方法3: 完整优化流程
const optimization = applyPerformanceOptimization(
  data,
  {
    enabled: true,
    sampling: 'lttb',
    maxPoints: 2000,
    aggregation: 'avg',
    aggregationWindow: 10,
  },
  'timestamp',
  'value'
);

console.log(optimization.optimizationInfo);
```

### React Hook 使用

```tsx
import { useChartPerformance, useProgressiveRender } from '@naeemo/cdl-react';

function LargeChart({ data }) {
  // 图表性能优化
  const { optimizedData, isOptimized, info, echartsConfig } = useChartPerformance({
    data,
    xField: 'timestamp',
    yField: 'value',
    performanceHints: {
      enabled: 'auto',
      sampling: 'lttb',
      maxPoints: 2000,
    },
  });
  
  // 渐进渲染
  const [renderState, { start, abort }] = useProgressiveRender({
    totalCount: optimizedData.length,
    frameSize: 500,
  });
  
  useEffect(() => {
    start(optimizedData);
  }, [optimizedData]);
  
  return (
    <div>
      <ReactECharts 
        option={{
          series: [{
            data: renderState.renderedData,
          }],
          ...echartsConfig,
        }}
      />
      {renderState.isRendering && (
        <ProgressBar progress={renderState.progress} />
      )}
    </div>
  );
}
```

## 算法详解

### LTTB (Largest Triangle Three Buckets)

LTTB 是一种高质量的时序数据降采样算法：

1. 始终保留第一个和最后一个数据点
2. 将剩余数据分成 N-2 个桶
3. 对每个桶，计算与前后点形成最大三角形的点
4. 选择该点作为抽样点

优点：
- 保持数据整体趋势
- 保留局部极值
- 视觉保真度高

复杂度：O(n)，适合实时处理。

### 渐进渲染调度

使用 `requestAnimationFrame` 或 `setTimeout` 分批渲染：

```
Frame 1: 渲染 0-500 条数据
Frame 2: 渲染 500-1000 条数据
...
Frame N: 渲染完成
```

每帧渲染时间控制在 16ms 以内，保证 60fps 流畅度。

## 性能建议

### 数据量指导

| 数据点数量 | 建议方案 |
|-----------|---------|
| < 1,000 | 无需优化 |
| 1,000 - 5,000 | 可选启用抽样 |
| 5,000 - 10,000 | 建议启用 LTTB 抽样 |
| 10,000 - 50,000 | 启用抽样 + 渐进渲染 |
| 50,000 - 100,000 | 启用抽样 + 聚合 + dataZoom |
| > 100,000 | 建议服务端预处理 |

### 最佳实践

1. **合理设置阈值**：根据设备性能调整 `enableThreshold`
2. **组合优化**：抽样 + 渐进渲染 + dataZoom 效果最佳
3. **监控性能**：使用 `PerformanceMonitor` 跟踪优化效果
4. **渐进增强**：先实现功能，再按需优化

## API 参考

### 抽样函数

```typescript
// LTTB 抽样
function lttbSampling(
  data: DataPoint[],
  threshold: number,
  xField?: string,
  yField?: string
): DataPoint[]

// 平均值抽样
function averageSampling(
  data: DataPoint[],
  threshold: number,
  xField?: string,
  yField?: string
): DataPoint[]

// Min-Max 抽样
function minMaxSampling(
  data: DataPoint[],
  threshold: number,
  xField?: string,
  yField?: string
): DataPoint[]

// 随机抽样
function randomSampling(
  data: DataPoint[],
  threshold: number
): DataPoint[]

// 通用抽样接口
function sampleData(
  data: DataPoint[],
  options: SamplingOptions
): DataPoint[]
```

### 渐进渲染

```typescript
class ProgressiveRenderer {
  constructor(options: ProgressiveOptions)
  
  // 渐进渲染数据
  async render<T>(
    data: T[],
    renderFn: (batch: T[], progress: number) => void | Promise<void>,
    onComplete?: () => void
  ): Promise<void>
  
  // 中止渲染
  abort(): void
  
  // 是否正在渲染
  get running(): boolean
}
```

### 懒加载

```typescript
class LazyDataLoader<T> {
  constructor(
    options: LazyLoadOptions,
    dataProvider: (batchIndex: number, batchSize: number) => Promise<T[]>
  )
  
  // 加载指定批次
  async loadBatch(batchIndex: number): Promise<T[]>
  
  // 预加载后续批次
  preloadBatches(currentBatch: number, count?: number): void
  
  // 清空缓存
  clearCache(): void
}
```

## 测试

运行性能测试：

```bash
cd packages/renderer
npx ts-node src/performance/performance.test.ts
```

测试覆盖：
- LTTB、Average、MinMax、Random 抽样算法
- 虚拟滚动范围计算
- 渐进渲染调度
- 懒加载缓存
- 性能监控
- 完整优化流程
