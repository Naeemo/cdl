<script setup lang="ts">
import { computed } from 'vue';
import { useDynamicChart, UseDynamicChartOptions } from './index';

interface Props extends Omit<UseDynamicChartOptions, 'code' | 'theme' | 'dataSource' | 'refreshInterval' | 'enableStreaming'> {
  code: string;
  theme?: 'light' | 'dark';
  dataSource?: import('@naeemo/cdl-core').DataSourceConfig;
  refreshInterval?: number;
  enableStreaming?: boolean;
  className?: string;
  showConnectionStatus?: boolean;
  showStats?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  enableStreaming: false,
  showConnectionStatus: true,
  showStats: false,
  updateStrategy: 'append',
  timeField: 'timestamp',
  maxDataPoints: 1000,
});

const emit = defineEmits<{
  (e: 'compileError', error: string): void;
  (e: 'dataUpdate', state: { data: any[]; lastUpdate: number | null; updateCount: number }): void;
  (e: 'connectionChange', connected: boolean): void;
  (e: 'error', error: Error): void;
}>();

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
  code: computed(() => props.code),
  theme: computed(() => props.theme),
  dataSource: computed(() => props.dataSource),
  refreshInterval: computed(() => props.refreshInterval),
  enableStreaming: computed(() => props.enableStreaming),
  updateStrategy: props.updateStrategy,
  timeField: props.timeField,
  maxDataPoints: props.maxDataPoints,
});

const containerStyle = computed(() => ({
  position: 'relative' as const,
  width: '100%',
  height: '400px',
}));

const statusStyle = computed(() => ({
  position: 'absolute' as const,
  top: '8px',
  right: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 12px',
  background: props.theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
  borderRadius: '4px',
  fontSize: '12px',
  zIndex: 10,
}));

const dotStyle = (connected: boolean) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: connected ? '#52c41a' : '#ff4d4f',
});

const buttonStyle = computed(() => ({
  padding: '4px 12px',
  background: props.theme === 'dark' ? '#333' : '#fff',
  border: `1px solid ${props.theme === 'dark' ? '#555' : '#d9d9d9'}`,
  borderRadius: '4px',
  cursor: 'pointer',
  color: props.theme === 'dark' ? '#fff' : '#333',
}));
</script>

<template>
  <div :class="className" :style="containerStyle">
    <!-- 连接状态 -->
    <div
      v-if="showConnectionStatus && enableStreaming"
      :style="statusStyle"
    >
      <span :style="dotStyle(isConnected)" />
      <span :style="{ color: theme === 'dark' ? '#fff' : '#333' }">
        {{ isConnected ? '已连接' : '未连接' }}
      </span>
      <span
        v-if="isStreaming"
        :style="{ color: '#52c41a', marginLeft: '8px' }"
      >
        ● 接收中
      </span>
    </div>

    <!-- 统计信息 -->
    <div
      v-if="showStats && streamStats"
      :style="{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        padding: '8px 12px',
        background: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
        borderRadius: '4px',
        fontSize: '11px',
        color: theme === 'dark' ? '#ccc' : '#666',
        zIndex: 10,
      }"
    >
      <div>批次: {{ streamStats.receivedBatches }}</div>
      <div>记录: {{ streamStats.receivedRecords }}</div>
      <div v-if="streamStats.lastReceivedAt">
        最后更新: {{ new Date(streamStats.lastReceivedAt).toLocaleTimeString() }}
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="error"
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: '4px',
        padding: '16px',
        height: '100%',
      }"
    >
      <div :style="{ color: '#cf222e', fontSize: '14px' }">
        <strong>❌ 图表错误</strong>
        <pre :style="{ marginTop: '8px', whiteSpace: 'pre-wrap' }">{{ error }}</pre>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="isLoading && !error"
      :style="{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#999',
      }"
    >
      加载中...
    </div>

    <!-- 图表容器 -->
    <div
      v-show="!error"
      ref="chartRef"
      :style="{ width: '100%', height: '100%' }"
    />

    <!-- 控制按钮 -->
    <div
      v-if="enableStreaming"
      :style="{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        display: 'flex',
        gap: '8px',
        zIndex: 10,
      }"
    >
      <button :style="buttonStyle" @click="refresh">刷新</button>
      <button
        v-if="isStreaming"
        @click="stopStreaming"
        :style="{
          padding: '4px 12px',
          background: '#ff4d4f',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#fff',
        }"
      >
        暂停
      </button>
      <button
        v-else
        @click="startStreaming"
        :style="{
          padding: '4px 12px',
          background: '#52c41a',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#fff',
        }"
      >
        开始
      </button>
      <button :style="buttonStyle" @click="clearData">清空</button>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
