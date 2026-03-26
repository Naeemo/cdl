# CDL 动态更新功能

## 概述

CDL 动态更新模块提供了数据流式更新、实时图表刷新和自动轮询机制，支持 WebSocket、Server-Sent Events (SSE) 和轮询三种数据获取方式。

## 安装

```bash
# React
pnpm add @cdl/react-dynamic

# Vue
pnpm add @cdl/vue-dynamic

# 核心模块（用于自定义集成）
pnpm add @cdl/dynamic-core
```

## 核心功能

### 1. 数据流管理 (DataStreamManager)

统一管理多种数据流：
- **WebSocket**: 双向实时通信
- **SSE**: 服务器推送事件
- **Polling**: 定时轮询
- **Push**: 外部推送模式

```typescript
import { DataStreamManager } from '@cdl/dynamic-core';

const manager = new DataStreamManager(
  {
    type: 'websocket',
    url: 'wss://api.example.com/stream',
    reconnectInterval: 3000,  // 重连间隔
    maxReconnects: 10,        // 最大重连次数
  },
  {
    onData: (batch) => console.log('收到数据:', batch),
    onError: (err) => console.error('错误:', err),
    onConnect: () => console.log('已连接'),
    onDisconnect: (reason) => console.log('断开:', reason),
  }
);

manager.start();
```

### 2. 图表数据管理 (ChartDataManager)

增量数据更新，支持多种更新策略：

```typescript
import { ChartDataManager, timeSeriesUpdateStrategy } from '@cdl/dynamic-core';

// 使用时间序列策略
const dataManager = new ChartDataManager(
  timeSeriesUpdateStrategy('timestamp')
);

// 订阅数据变化
dataManager.subscribe((state) => {
  console.log('数据更新:', state.data);
  console.log('更新次数:', state.updateCount);
});

// 更新数据
dataManager.update({
  data: [{ timestamp: Date.now(), value: 100 }],
  timestamp: Date.now(),
  full: false,  // false 表示增量更新
});
```

### 3. 自动轮询调度器 (PollScheduler)

管理多个轮询任务，避免请求风暴：

```typescript
import { PollScheduler } from '@cdl/dynamic-core';

const scheduler = new PollScheduler();

scheduler.addTask({
  id: 'chart1',
  url: 'https://api.example.com/data',
  interval: 5000,  // 5秒轮询
  handler: (data) => console.log('数据:', data),
  errorHandler: (err) => console.error('错误:', err),
});
```

## React 使用示例

### 基础用法

```tsx
import { DynamicCDLChart } from '@cdl/react-dynamic';

function App() {
  const cdlCode = `
chart line {
  data sales @source('https://api.example.com/sales')
  x: date
  y: amount
  @live 5000
}
  `;

  return (
    <DynamicCDLChart
      code={cdlCode}
      theme="dark"
      dataSource={{
        type: 'polling',
        url: 'https://api.example.com/sales',
        interval: 5000,
      }}
      enableStreaming={true}
      updateStrategy="timeseries"
      timeField="date"
      showConnectionStatus={true}
      showStats={true}
    />
  );
}
```

### 使用 Hook

```tsx
import { useDynamicChart } from '@cdl/react-dynamic';

function CustomChart() {
  const { chartRef, isStreaming, isConnected, dataState } = useDynamicChart({
    code: cdlCode,
    dataSource: {
      type: 'websocket',
      url: 'wss://stream.example.com/data',
    },
    enableStreaming: true,
  });

  return (
    <div>
      <div ref={chartRef} style={{ width: '100%', height: 400 }} />
      <div>状态: {isConnected ? '已连接' : '未连接'}</div>
      <div>数据点: {dataState.data.length}</div>
    </div>
  );
}
```

### 流式数据 Hook

```tsx
import { useStreamingData } from '@cdl/react-dynamic';

function DataStream() {
  const { isConnected, lastBatch, start, stop } = useStreamingData({
    dataSource: {
      type: 'sse',
      url: 'https://api.example.com/events',
    },
    autoStart: true,
    onData: (batch) => console.log('收到:', batch.data),
  });

  return (
    <div>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
      <div>连接: {isConnected ? '是' : '否'}</div>
    </div>
  );
}
```

## Vue 使用示例

### 基础用法

```vue
<script setup lang="ts">
import { DynamicCDLChart } from '@cdl/vue-dynamic';

const cdlCode = `
chart line {
  data metrics
  x: time
  y: value
}
`;

const dataSource = {
  type: 'websocket' as const,
  url: 'wss://metrics.example.com/stream',
};
</script>

<template>
  <DynamicCDLChart
    :code="cdlCode"
    theme="dark"
    :dataSource="dataSource"
    :enableStreaming="true"
    :showConnectionStatus="true"
  />
</template>
```

### 使用 Composable

```vue
<script setup lang="ts">
import { useDynamicChart } from '@cdl/vue-dynamic';

const { chartRef, isConnected, dataState, refresh } = useDynamicChart({
  code: cdlCode,
  dataSource: {
    type: 'polling',
    url: 'https://api.example.com/data',
    interval: 10000,
  },
  enableStreaming: true,
});
</script>

<template>
  <div>
    <div ref="chartRef" style="width: 100%; height: 400px;" />
    <button @click="refresh">刷新</button>
    <div>数据点: {{ dataState.data.length }}</div>
  </div>
</template>
```

## 数据源配置

### WebSocket

```typescript
{
  type: 'websocket',
  url: 'wss://api.example.com/stream',
  authToken: 'your-token',      // 可选
  reconnectInterval: 3000,      // 重连间隔
  maxReconnects: 10,            // 最大重连次数
}
```

### Server-Sent Events (SSE)

```typescript
{
  type: 'sse',
  url: 'https://api.example.com/events',
  authToken: 'your-token',
  reconnectInterval: 5000,
}
```

### Polling

```typescript
{
  type: 'polling',
  url: 'https://api.example.com/data',
  method: 'GET',
  interval: 5000,               // 轮询间隔
  headers: { 'X-API-Key': 'key' },
}
```

### POST 轮询

```typescript
{
  type: 'polling',
  url: 'https://api.example.com/query',
  method: 'POST',
  body: { query: 'SELECT * FROM metrics' },
  interval: 10000,
}
```

## 数据更新策略

### Append（追加）

默认策略，新数据追加到现有数据，保持滑动窗口：

```typescript
updateStrategy: 'append'  // 或 { maxPoints: 1000 }
```

### Replace（替换）

新数据完全替换旧数据：

```typescript
updateStrategy: 'replace'
```

### TimeSeries（时间序列）

按时间字段排序并去重：

```typescript
updateStrategy: 'timeseries',
timeField: 'timestamp'
```

### 自定义策略

```typescript
import { ChartUpdateStrategy } from '@cdl/dynamic-core';

const customStrategy: ChartUpdateStrategy = {
  merge: (existing, incoming) => {
    // 自定义合并逻辑
    return [...incoming, ...existing].slice(0, 500);
  },
  dedupKey: 'id',           // 去重键
  maxPoints: 500,           // 最大数据点
};

updateStrategy: customStrategy
```

## 数据格式

服务器返回的数据格式：

```typescript
// 数组格式
[
  { timestamp: 1234567890, value: 100 },
  { timestamp: 1234567891, value: 120 }
]

// 对象格式
{
  data: [
    { timestamp: 1234567890, value: 100 },
    { timestamp: 1234567891, value: 120 }
  ],
  timestamp: 1234567892,
  full: false,  // true 表示全量更新
}
```

## 事件处理

### React

```tsx
<DynamicCDLChart
  code={cdlCode}
  onCompileError={(error) => console.error('编译错误:', error)}
  onDataUpdate={(state) => console.log('数据更新:', state)}
  onConnectionChange={(connected) => console.log('连接状态:', connected)}
  onError={(error) => console.error('流错误:', error)}
/>
```

### Vue

```vue
<DynamicCDLChart
  :code="cdlCode"
  @compileError="handleCompileError"
  @dataUpdate="handleDataUpdate"
  @connectionChange="handleConnectionChange"
  @error="handleError"
/>
```

## 性能优化

1. **使用增量更新**: 默认使用 `notMerge: false` 更新 ECharts，只更新变化的数据
2. **滑动窗口**: 设置 `maxDataPoints` 限制数据点数量
3. **防抖渲染**: 数据更新时自动合并短时间内的多次更新
4. **智能重连**: 指数退避重连策略，避免服务器压力

## 完整示例

查看 `examples/` 目录：
- `examples/react-realtime.tsx` - React 实时图表
- `examples/vue-realtime.vue` - Vue 实时图表
- `examples/websocket-server.js` - WebSocket 测试服务器
