/**
 * React 实时图表示例
 * 
 * 展示如何使用 DynamicCDLChart 和 useDynamicChart 实现实时数据更新
 */

import React, { useState } from 'react';
import { DynamicCDLChart, useDynamicChart, useStreamingData } from '@cdl/react-dynamic';

// ===== 示例 1: 基础实时折线图 =====

const BasicRealtimeChart: React.FC = () => {
  const cdlCode = `
chart line {
  data metrics
  x: time
  y: value
  @style "smooth"
  @color "#5470c6"
}
  `;

  return (
    <div style={{ padding: 20 }>}
      <h2>基础实时折线图</h2>
      <DynamicCDLChart
        code={cdlCode}
        theme="light"
        dataSource={{
          type: 'polling',
          url: 'https://api.example.com/metrics',
          interval: 5000,
        }}
        enableStreaming={true}
        showConnectionStatus={true}
        showStats={true}
        style={{ height: 400 }}
      />
    </div>
  );
};

// ===== 示例 2: WebSocket 实时数据 =====

const WebSocketChart: React.FC = () => {
  const cdlCode = `
chart line {
  data trades
  x: timestamp
  y: price
  group: symbol
  @style "smooth"
}
  `;

  const [symbols, setSymbols] = useState(['BTC', 'ETH']);

  return (
    <div style={{ padding: 20 }>}
      <h2>WebSocket 实时交易数据</h2>
      <div style={{ marginBottom: 16 }>}
        {symbols.map((symbol) => (
          <span
            key={symbol}
            style={{
              marginRight: 8,
              padding: '4px 12px',
              background: '#f0f0f0',
              borderRadius: 4,
            }}
          >
            {symbol}
          </span>
        ))}
      </div>
      <DynamicCDLChart
        code={cdlCode}
        theme="dark"
        dataSource={{
          type: 'websocket',
          url: 'wss://stream.exchange.com/trades',
          authToken: 'your-api-token',
          reconnectInterval: 3000,
        }}
        enableStreaming={true}
        updateStrategy="timeseries"
        timeField="timestamp"
        maxDataPoints={500}
        showConnectionStatus={true}
        style={{ height: 500 }}
      />
    </div>
  );
};

// ===== 示例 3: 使用 Hook 自定义控制 =====

const CustomControlledChart: React.FC = () => {
  const cdlCode = `
chart bar {
  data server_load
  x: server
  y: cpu_percent
  @title "服务器 CPU 使用率"
}
  `;

  const {
    chartRef,
    isLoading,
    isStreaming,
    isConnected,
    error,
    dataState,
    streamStats,
    refresh,
    startStreaming,
    stopStreaming,
    clearData,
  } = useDynamicChart({
    code: cdlCode,
    theme: 'light',
    dataSource: {
      type: 'polling',
      url: 'https://monitoring.example.com/servers',
      interval: 10000,
    },
    enableStreaming: true,
    updateStrategy: 'replace',  // 每次获取全量数据
  });

  return (
    <div style={{ padding: 20 }>}
      <h2>自定义控制图表</h2>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }>}
        <button onClick={refresh} disabled={isLoading}>刷新</button>
        <button onClick={startStreaming} disabled={isStreaming}>开始</button>
        <button onClick={stopStreaming} disabled={!isStreaming}>停止</button>
        <button onClick={clearData}>清空数据</button>
      </div>

      <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }>}
        <span>状态: {isConnected ? '🟢 已连接' : '🔴 未连接'} | </span>
        <span>数据点: {dataState.data.length} | </span>
        <span>更新次数: {dataState.updateCount}</span>
        {streamStats && (
          <> | <span>接收批次: {streamStats.receivedBatches}</span></>
        )}
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 16 }>错误: {error}</div>
      )}

      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: 400,
          background: '#f5f5f5',
          borderRadius: 8,
        }}
      />
    </div>
  );
};

// ===== 示例 4: 仅流式数据 Hook =====

const DataStreamOnly: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);

  const { isConnected, lastBatch, stats, start, stop } = useStreamingData({
    dataSource: {
      type: 'sse',
      url: 'https://api.example.com/notifications',
    },
    autoStart: false,
    onData: (batch) => {
      setMessages((prev) => [...prev.slice(-50), ...batch.data]);
    },
  });

  return (
    <div style={{ padding: 20 }>}
      <h2>仅流式数据（无图表）</h2>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }>}
        <button onClick={start}>连接</button>
        <button onClick={stop}>断开</button>
      </div>

      <div style={{ marginBottom: 16 }>}
        <span>连接: {isConnected ? '是' : '否'} | </span>
        <span>消息数: {messages.length}</span>
        {stats && <span> | 总批次: {stats.receivedBatches}</span>}
      </div>

      <div
        style={{
          height: 300,
          overflow: 'auto',
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 8,
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 4, fontSize: 12 }>}
            <pre>{JSON.stringify(msg, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 示例 5: 多图表联动 =====

const LinkedCharts: React.FC = () => {
  const lineCode = `
chart line {
  data performance
  x: time
  y: throughput
  @title "吞吐量趋势"
}
  `;

  const barCode = `
chart bar {
  data performance
  x: time
  y: errors
  @title "错误数"
}
  `;

  const gaugeCode = `
chart gauge {
  data performance
  x: metric
  y: value
  @title "当前 QPS"
}
  `;

  const sharedDataSource = {
    type: 'polling' as const,
    url: 'https://api.example.com/performance',
    interval: 3000,
  };

  return (
    <div style={{ padding: 20 }>}
      <h2>多图表联动（共享数据源）</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }>}
        <DynamicCDLChart
          code={lineCode}
          dataSource={sharedDataSource}
          enableStreaming={true}
          updateStrategy="timeseries"
          style={{ height: 300 }}
        />
        <DynamicCDLChart
          code={barCode}
          dataSource={sharedDataSource}
          enableStreaming={true}
          updateStrategy="timeseries"
          style={{ height: 300 }}
        />
      </div>
      
      <DynamicCDLChart
        code={gaugeCode}
        dataSource={sharedDataSource}
        enableStreaming={true}
        updateStrategy="replace"
        style={{ height: 300, marginTop: 16 }}
      />
    </div>
  );
};

// ===== 主应用 =====

export const App: React.FC = () => {
  return (
    <div>
      <h1>CDL 动态更新示例</h1>
      <BasicRealtimeChart />
      <WebSocketChart />
      <CustomControlledChart />
      <DataStreamOnly />
      <LinkedCharts />
    </div>
  );
};

export default App;
