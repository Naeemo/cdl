# CDL 动态更新模块

支持数据流式更新、实时图表刷新、自动轮询机制

## 核心功能

- **DataStreamManager**: 统一管理多种数据流（WebSocket、SSE、轮询）
- **ChartUpdater**: 图表增量更新引擎
- **useDynamicChart**: React Hook 用于动态图表
- **useStreamingData**: React Hook 用于流式数据

## 使用方式

```typescript
import { useDynamicChart } from '@cdl/react-dynamic';

function MyChart() {
  const { chartRef, isStreaming, error } = useDynamicChart({
    code: cdlCode,
    dataSource: {
      type: 'websocket',
      url: 'wss://api.example.com/stream',
    },
    refreshInterval: 5000, // 轮询间隔（毫秒）
    enableStreaming: true,
  });

  return <div ref={chartRef} style={{ width: '100%', height: 400 }} />;
}
```
