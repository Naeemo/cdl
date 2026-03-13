<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
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
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  width: '100%',
  height: 400,
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
    emit('success');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    error.value = errorMsg;
    loading.value = false;
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
  >
    <!-- Error State -->
    <div
      v-if="error"
      class="cdl-chart-error"
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
</style>