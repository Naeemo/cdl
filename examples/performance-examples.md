# CDL 性能优化示例

## 大数据集折线图（10万+数据点）

```cdl
Data StockPrice {
    LoadCSV "stock_1year.csv"
    datetime,price,volume
}

Chart 股票价格走势 {
    use StockPrice
    type line
    x datetime
    y price
    
    // 启用性能优化
    @hint "performance=true"
    @hint "sampling=lttb"
    @hint "maxPoints=2000"
    @hint "progressive=true"
    @hint "progressiveChunk=500"
    
    // 启用缩放交互
    @interaction "zoom:slider"
}
```

## 实时数据流

```cdl
Data SensorData {
    // 模拟实时数据
    time,value,sensor_id
    2024-01-01 00:00:00,23.5,sensor_1
    2024-01-01 00:01:00,24.1,sensor_1
    // ... 更多数据
}

Chart 传感器实时监控 {
    use SensorData
    type line
    x time
    y value
    group sensor_id
    
    // 启用懒加载
    @hint "lazyLoad=true"
    @hint "batchSize=1000"
    @hint "preloadEnabled=true"
    
    // 实时更新
    @interaction "live:5000"
}
```

## 超大散点图（50万点）

```cdl
Data ScatterData {
    x,y,category
    1.2,3.4,A
    2.1,4.5,A
    // ... 50万条
}

Chart 大规模散点图 {
    use ScatterData
    type scatter
    x x
    y y
    group category
    
    // 启用聚合优化
    @hint "performance=auto"
    @hint "threshold=10000"
    @hint "aggregation=avg"
    @hint "aggregationWindow=50"
    
    // 使用 MinMax 抽样保留极值
    @hint "sampling=minmax"
    @hint "maxPoints=5000"
}
```

## 虚拟滚动表格

```cdl
Data LargeTable {
    id,name,value,status
    1,Item 1,100,active
    2,Item 2,200,inactive
    // ... 10万行
}

Chart 大数据表格 {
    use LargeTable
    type custom
    
    // 虚拟滚动配置
    @hint "virtualScroll=true"
    @hint "viewportSize=50"
    @hint "bufferSize=10"
}
```

## React 组件中使用

```tsx
import { CDLChart, useChartPerformance } from '@naeemo/cdl-react';
import ReactECharts from 'echarts-for-react';

function LargeDatasetChart() {
  // 假设有 10 万条数据
  const rawData = generateLargeDataset(100000);
  
  const { 
    optimizedData, 
    isOptimized, 
    info, 
    echartsConfig 
  } = useChartPerformance({
    data: rawData,
    xField: 'timestamp',
    yField: 'value',
    performanceHints: {
      enabled: 'auto',
      sampling: 'lttb',
      maxPoints: 2000,
      progressive: true,
    },
  });
  
  const option = {
    series: [{
      type: 'line',
      data: optimizedData.map(d => [d.timestamp, d.value]),
    }],
    ...echartsConfig,
  };
  
  return (
    <div>
      {isOptimized && (
        <div className="optimization-badge">
          数据已优化: {info.originalCount.toLocaleString()} → 
          {info.optimizedCount.toLocaleString()} 
          ({(info.samplingRatio * 100).toFixed(1)}%)
        </div>
      )}
      <ReactECharts option={option} />
    </div>
  );
}
```

## Vue 组件中使用

```vue
<template>
  <div>
    <div v-if="isOptimized" class="optimization-badge">
      数据已优化: {{ info.originalCount.toLocaleString() }} → 
      {{ info.optimizedCount.toLocaleString() }}
      ({{ (info.samplingRatio * 100).toFixed(1) }}%)
    </div>
    <v-chart :option="chartOption" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useChartPerformance } from '@naeemo/cdl-vue';
import VChart from 'vue-echarts';

const props = defineProps({
  rawData: Array,
});

const { optimizedData, isOptimized, info, echartsConfig } = useChartPerformance({
  data: props.rawData,
  xField: 'timestamp',
  yField: 'value',
  performanceHints: {
    enabled: 'auto',
    sampling: 'lttb',
    maxPoints: 2000,
  },
});

const chartOption = computed(() => ({
  series: [{
    type: 'line',
    data: optimizedData.value.map(d => [d.timestamp, d.value]),
  }],
  ...echartsConfig.value,
}));
</script>
```

## 渐进渲染进度条

```tsx
import { useProgressiveRender } from '@naeemo/cdl-react';

function ProgressiveChart({ data }) {
  const [renderState, { start }] = useProgressiveRender({
    totalCount: data.length,
    frameSize: 500,
    frameInterval: 16,
  });
  
  useEffect(() => {
    start(data);
  }, [data]);
  
  return (
    <div>
      <ReactECharts 
        option={{ series: [{ data: renderState.renderedData }] }}
      />
      {renderState.isRendering && (
        <ProgressBar progress={renderState.progress} />
      )}
    </div>
  );
}
```

## 性能监控

```tsx
import { usePerformanceMonitor } from '@naeemo/cdl-react';

function MonitoredChart() {
  const { mark, measure, getReport } = usePerformanceMonitor({
    autoReport: true,
    reportInterval: 5000,
  });
  
  const handleRender = () => {
    mark('render-start');
    
    // 渲染图表...
    
    mark('render-end');
    const duration = measure('render', 'render-start', 'render-end');
    console.log(`渲染耗时: ${duration}ms`);
  };
  
  return (<div>{/* ... */}</div>);
}
```
