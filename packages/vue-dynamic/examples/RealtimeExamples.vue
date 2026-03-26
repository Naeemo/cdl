<script setup lang="ts">
import { ref } from 'vue';
import { DynamicCDLChart, useDynamicChart, useStreamingData } from '@cdl/vue-dynamic';

// ===== 示例 1: 基础实时折线图 =====
const basicCdlCode = `
chart line {
  data metrics
  x: time
  y: value
  @style "smooth"
}
`;

const basicDataSource = {
  type: 'polling' as const,
  url: 'https://api.example.com/metrics',
  interval: 5000,
};

// ===== 示例 2: WebSocket 实时数据 =====
const wsCdlCode = `
chart line {
  data trades
  x: timestamp
  y: price
  group: symbol
}
`;

const wsDataSource = {
  type: 'websocket' as const,
  url: 'wss://stream.exchange.com/trades',
  authToken: 'your-token',
};

const symbols = ref(['BTC', 'ETH', 'SOL']);

// ===== 示例 3: 使用 Composable 自定义控制 =====
const customCdlCode = `
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
  code: customCdlCode,
  theme: 'light',
  dataSource: {
    type: 'polling',
    url: 'https://monitoring.example.com/servers',
    interval: 10000,
  },
  enableStreaming: true,
  updateStrategy: 'replace',
});

// ===== 示例 4: 仅流式数据 =====
const messages = ref<any[]>([]);

const {
  isConnected: streamConnected,
  lastBatch,
  stats: streamStats2,
  start: startStream,
  stop: stopStream,
} = useStreamingData({
  dataSource: {
    type: 'sse',
    url: 'https://api.example.com/notifications',
  },
  autoStart: false,
});

// 监听数据变化
watch(lastBatch, (batch) => {
  if (batch) {
    messages.value = [...messages.value.slice(-50), ...batch.data];
  }
});

// ===== 示例 5: 多图表联动 =====
const lineCode = `
chart line {
  data performance
  x: time
  y: throughput
}
`;

const barCode = `
chart bar {
  data performance
  x: time
  y: errors
}
`;

const sharedDataSource = {
  type: 'polling' as const,
  url: 'https://api.example.com/performance',
  interval: 3000,
};
</script>

<template>
  <div class="examples">
    <h1>CDL Vue 动态更新示例</h1>

    <!-- 示例 1: 基础实时折线图 -->
    <section class="example">
      <h2>基础实时折线图</h2>
      <DynamicCDLChart
        :code="basicCdlCode"
        theme="light"
        :dataSource="basicDataSource"
        :enableStreaming="true"
        :showConnectionStatus="true"
        :showStats="true"
        style="height: 400px"
      />
    </section>

    <!-- 示例 2: WebSocket 实时数据 -->
    <section class="example">
      <h2>WebSocket 实时交易数据</h2>
      <div class="tags">
        <span v-for="symbol in symbols" :key="symbol" class="tag">
          {{ symbol }}
        </span>
      </div>
      <DynamicCDLChart
        :code="wsCdlCode"
        theme="dark"
        :dataSource="wsDataSource"
        :enableStreaming="true"
        updateStrategy="timeseries"
        timeField="timestamp"
        :maxDataPoints="500"
        :showConnectionStatus="true"
        style="height: 500px"
      />
    </section>

    <!-- 示例 3: 使用 Composable 自定义控制 -->
    <section class="example">
      <h2>自定义控制图表</h2>
      
      <div class="controls">
        <button @click="refresh" :disabled="isLoading">刷新</button>
        <button @click="startStreaming" :disabled="isStreaming">开始</button>
        <button @click="stopStreaming" :disabled="!isStreaming">停止</button>
        <button @click="clearData">清空数据</button>
      </div>

      <div class="stats">
        <span>状态: {{ isConnected ? '🟢 已连接' : '🔴 未连接' }} | </span>
        <span>数据点: {{ dataState.data.length }} | </span>
        <span>更新次数: {{ dataState.updateCount }}</span>
        <span v-if="streamStats"> | 接收批次: {{ streamStats.receivedBatches }}</span>
      </div>

      <div v-if="error" class="error">错误: {{ error }}</div>

      <div ref="chartRef" class="chart-container" />
    </section>

    <!-- 示例 4: 仅流式数据 -->
    <section class="example">
      <h2>仅流式数据（无图表）</h2>
      
      <div class="controls">
        <button @click="startStream">连接</button>
        <button @click="stopStream">断开</button>
      </div>

      <div class="stats">
        <span>连接: {{ streamConnected ? '是' : '否' }} | </span>
        <span>消息数: {{ messages.length }}</span>
        <span v-if="streamStats2"> | 总批次: {{ streamStats2.receivedBatches }}</span>
      </div>

      <div class="message-list">
        <div v-for="(msg, idx) in messages" :key="idx" class="message">
          <pre>{{ JSON.stringify(msg, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <!-- 示例 5: 多图表联动 -->
    <section class="example">
      <h2>多图表联动（共享数据源）</h2>
      
      <div class="grid">
        <DynamicCDLChart
          :code="lineCode"
          :dataSource="sharedDataSource"
          :enableStreaming="true"
          updateStrategy="timeseries"
          style="height: 300px"
        />
        <DynamicCDLChart
          :code="barCode"
          :dataSource="sharedDataSource"
          :enableStreaming="true"
          updateStrategy="timeseries"
          style="height: 300px"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.examples {
  padding: 20px;
}

.example {
  margin-bottom: 40px;
}

.example h2 {
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
}

.tags {
  margin-bottom: 16px;
}

.tag {
  margin-right: 8px;
  padding: 4px 12px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
}

.controls {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.controls button {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.error {
  color: #ff4d4f;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
}

.message-list {
  height: 300px;
  overflow: auto;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.message {
  margin-bottom: 8px;
  font-size: 12px;
}

.message pre {
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
