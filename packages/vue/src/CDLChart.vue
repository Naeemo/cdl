<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as echarts from 'echarts';

interface Props {
  /** CDL source code */
  code: string;
  /** Chart theme */
  theme?: 'light' | 'dark';
  /** Chart width */
  width?: number | string;
  /** Chart height */
  height?: number | string;
  /** Accessible label for the chart (for screen readers) */
  ariaLabel?: string;
  /** Detailed description of the chart data (for screen readers) */
  ariaDescription?: string;
  /** Whether the chart is decorative (aria-hidden) */
  decorative?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  width: '100%',
  height: 400,
  ariaLabel: '数据图表',
  decorative: false,
});

const emit = defineEmits<{
  (e: 'click', data: any): void;
  (e: 'success'): void;
  (e: 'error', error: string): void;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const chartInstance = ref<echarts.ECharts | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);
const liveRegion = ref<HTMLDivElement | null>(null);
const chartId = computed(() => `cdl-chart-${Math.random().toString(36).substr(2, 9)}`);

// Announce message to screen readers
const announce = (message: string) => {
  if (liveRegion.value) {
    liveRegion.value.textContent = message;
    setTimeout(() => {
      if (liveRegion.value) {
        liveRegion.value.textContent = '';
      }
    }, 1000);
  }
};

const renderChart = async () => {
  if (!chartRef.value || !props.code) return;

  try {
    loading.value = true;
    error.value = null;

    const { compile } = await import('@cdl/compiler');
    const { render } = await import('@cdl/renderer-echarts');

    const compileResult = compile(props.code);
    if (!compileResult.success) {
      const errorMsg = compileResult.errors
        .map((e) => `Line ${e.line}: ${e.message}`)
        .join('\n');
      throw new Error(errorMsg);
    }

    const renderResult = render(compileResult.result);
    if (!renderResult.success) {
      throw new Error(renderResult.error || 'Render failed');
    }

    // Initialize or update chart
    if (!chartInstance.value) {
      chartInstance.value = echarts.init(chartRef.value, props.theme);
      
      chartInstance.value.on('click', (params) => {
        emit('click', params);
      });
    }

    chartInstance.value.setOption(renderResult.option, true);
    
    loading.value = false;
    announce('图表加载完成');
    emit('success');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    error.value = errorMsg;
    loading.value = false;
    announce(`图表加载失败: ${errorMsg}`);
    emit('error', errorMsg);
  }
};

const handleResize = () => {
  chartInstance.value?.resize();
};

onMounted(() => {
  renderChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance.value?.dispose();
  chartInstance.value = null;
});

// Watch for code/theme changes
watch(() => props.code, () => {
  renderChart();
});

watch(() => props.theme, () => {
  chartInstance.value?.dispose();
  chartInstance.value = null;
  renderChart();
});
</script>

<template>
  <div
    class="cdl-chart"
    :style="{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      position: 'relative',
    }"
    :role="decorative ? 'presentation' : 'region'"
    :aria-label="ariaLabel"
    :id="chartId"
  >
    <!-- Screen reader live region for announcements -->
    <div
      ref="liveRegion"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
      :style="{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0,
      }"
    />
    
    <!-- Screen reader description -->
    <div
      v-if="ariaDescription"
      class="sr-only"
      :style="{ display: 'none' }"
    >
      {{ ariaDescription }}
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="cdl-chart-error"
      role="alert"
      aria-live="assertive"
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
        <strong>❌ CDL Error</strong>
        <pre :style="{ marginTop: '8px', whiteSpace: 'pre-wrap' }">{{ error }}</pre>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && !error"
      class="cdl-chart-loading"
      role="status"
      aria-live="polite"
      aria-label="图表加载中"
      :style="{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#999',
      }"
    >
      Loading...
    </div>

    <!-- Chart Container -->
    <div
      v-show="!error"
      ref="chartRef"
      :style="{ width: '100%', height: '100%' }"
      role="img"
      :aria-label="ariaDescription || `${ariaLabel}，使用键盘Tab键可以导航到图表元素`"
      :tabindex="decorative ? -1 : 0"
    />
  </div>
</template>

<style scoped>
.cdl-chart {
  box-sizing: border-box;
}

.cdl-chart-error pre {
  font-family: monospace;
  font-size: 12px;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
