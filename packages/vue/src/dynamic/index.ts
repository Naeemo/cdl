import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue';
import * as echarts from 'echarts';
import {
  DataStreamManager,
  DataSourceConfig,
  DataBatch,
  ChartDataManager,
  ChartUpdateStrategy,
  defaultUpdateStrategy,
  timeSeriesUpdateStrategy,
  StreamStats,
  ChartDataState,
} from '../core';

// Re-export core types
export type {
  DataSourceConfig,
  DataBatch,
  ChartUpdateStrategy,
  StreamStats,
  ChartDataState,
  DataPoint,
  DataStreamType,
} from '../core';

export {
  DataStreamManager,
  ChartDataManager,
  defaultUpdateStrategy,
  timeSeriesUpdateStrategy,
} from '../core';

export { default as DynamicCDLChart } from './DynamicCDLChart.vue';

// ==================== 类型定义 ====================

export interface UseDynamicChartOptions {
  /** CDL 代码 */
  code: Ref<string> | string;
  /** 图表主题 */
  theme?: Ref<'light' | 'dark'> | 'light' | 'dark';
  /** 数据源配置 */
  dataSource?: Ref<DataSourceConfig | undefined> | DataSourceConfig;
  /** 轮询间隔（毫秒） */
  refreshInterval?: Ref<number | undefined> | number;
  /** 是否启用流式更新 */
  enableStreaming?: Ref<boolean> | boolean;
  /** 数据更新策略 */
  updateStrategy?: ChartUpdateStrategy | 'append' | 'replace' | 'timeseries';
  /** 时间序列字段名 */
  timeField?: string;
  /** 最大数据点数量 */
  maxDataPoints?: number;
}

export interface UseDynamicChartReturn {
  /** 图表容器 ref */
  chartRef: Ref<HTMLDivElement | null>;
  /** 是否正在加载 */
  isLoading: Ref<boolean>;
  /** 是否正在流式接收数据 */
  isStreaming: Ref<boolean>;
  /** 是否已连接 */
  isConnected: Ref<boolean>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 当前数据状态 */
  dataState: Ref<ChartDataState>;
  /** 流统计信息 */
  streamStats: Ref<StreamStats | null>;
  /** 手动刷新 */
  refresh: () => void;
  /** 开始流式更新 */
  startStreaming: () => void;
  /** 停止流式更新 */
  stopStreaming: () => void;
  /** 清空数据 */
  clearData: () => void;
}

// ==================== 主 Composable ====================

export function useDynamicChart(options: UseDynamicChartOptions): UseDynamicChartReturn {
  const {
    code,
    theme = 'light',
    dataSource,
    refreshInterval,
    enableStreaming = false,
    updateStrategy = 'append',
    timeField = 'timestamp',
    maxDataPoints = 1000,
  } = options;

  const chartRef = ref<HTMLDivElement | null>(null);
  const chartInstance = ref<echarts.ECharts | null>(null);
  let streamManager: DataStreamManager | null = null;
  let dataManager: ChartDataManager | null = null;
  let cdlOption: any = null;
  let resizeHandler: (() => void) | null = null;

  const isLoading = ref(false);
  const isStreaming = ref(false);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  const dataState = ref<ChartDataState>({
    data: [],
    lastUpdate: null,
    updateCount: 0,
  });
  const streamStats = ref<StreamStats | null>(null);

  // 解析响应式值
  const getCode = () => (typeof code === 'string' ? code : code.value);
  const getTheme = () => (typeof theme === 'string' ? theme : theme.value);
  const getDataSource = () => {
    if (!dataSource) return undefined;
    return 'value' in dataSource ? dataSource.value : dataSource;
  };
  const getRefreshInterval = () => {
    if (!refreshInterval) return undefined;
    return typeof refreshInterval === 'number' ? refreshInterval : refreshInterval.value;
  };
  const getEnableStreaming = () => {
    return typeof enableStreaming === 'boolean' ? enableStreaming : enableStreaming.value;
  };

  // 解析更新策略
  const getStrategy = (): ChartUpdateStrategy => {
    if (typeof updateStrategy === 'object') return updateStrategy;
    switch (updateStrategy) {
      case 'replace':
        return { merge: (_, incoming) => incoming };
      case 'timeseries':
        return timeSeriesUpdateStrategy(timeField);
      case 'append':
      default:
        return {
          merge: (existing, incoming) => {
            const combined = [...existing, ...incoming];
            return combined.slice(-maxDataPoints);
          },
          maxPoints: maxDataPoints,
        };
    }
  };

  // 初始化数据管理器
  const initDataManager = () => {
    dataManager = new ChartDataManager(getStrategy());
    dataManager.subscribe((state) => {
      dataState.value = state;
      updateChartData(state.data);
    });
  };

  // 初始化图表
  const initChart = async () => {
    if (!chartRef.value) return;

    try {
      isLoading.value = true;
      error.value = null;

      // 使用 @naeemo/cdl-core 的动态导入
      const core = await import('@naeemo/cdl-core');
      const compileResult = core.compile(getCode());
      if (compileResult.errors.length > 0) {
        const errorMsg = compileResult.errors
          .map((e) => `Line ${e.line}: ${e.message}`)
          .join('\n');
        throw new Error(errorMsg);
      }

      const renderResult = core.render(compileResult.file, getTheme());
      if (!renderResult.success) {
        throw new Error(renderResult.error || 'Render failed');
      }

      cdlOption = renderResult.option;

      // 初始化 ECharts
      if (!chartInstance.value) {
        chartInstance.value = echarts.init(chartRef.value, getTheme());
        resizeHandler = () => chartInstance.value?.resize();
        window.addEventListener('resize', resizeHandler);
      }

      chartInstance.value.setOption(renderResult.option, true);
      isLoading.value = false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMsg;
      isLoading.value = false;
    }
  };

  // 更新图表数据
  const updateChartData = (data: any[]) => {
    if (!chartInstance.value || !cdlOption || data.length === 0) return;

    const series = cdlOption.series;
    if (!series || series.length === 0) return;

    const firstSeries = series[0];
    const chartType = firstSeries.type;

    let newOption: any = {};

    switch (chartType) {
      case 'line':
      case 'bar':
      case 'area':
        newOption = buildTimeSeriesUpdate(cdlOption, data);
        break;
      case 'pie':
      case 'funnel':
        newOption = buildPieUpdate(cdlOption, data);
        break;
      case 'scatter':
        newOption = buildScatterUpdate(cdlOption, data);
        break;
      case 'gauge':
        newOption = buildGaugeUpdate(cdlOption, data);
        break;
      default:
        newOption = {
          series: series.map((s: any, idx: number) => ({
            ...s,
            data: data.map((row: any) => row[s.field || `value${idx}`] || row.value || 0),
          })),
        };
    }

    chartInstance.value.setOption(newOption, false, true);
  };

  // 启动流式更新
  const startStream = () => {
    const ds = getDataSource();
    if (!ds || streamManager) return;

    const config: DataSourceConfig = {
      ...ds,
      interval: getRefreshInterval() || ds.interval,
    };

    streamManager = new DataStreamManager(config, {
      onData: (batch: DataBatch) => {
        dataManager?.update(batch);
      },
      onError: (err: Error) => {
        error.value = err.message;
      },
      onConnect: () => {
        isConnected.value = true;
        isStreaming.value = true;
      },
      onDisconnect: () => {
        isConnected.value = false;
        isStreaming.value = false;
      },
    });

    streamManager.start();
  };

  // 停止流式更新
  const stopStream = () => {
    streamManager?.stop();
    streamManager = null;
    isStreaming.value = false;
    isConnected.value = false;
  };

  // 生命周期
  onMounted(() => {
    initDataManager();
    initChart();
    if (getEnableStreaming()) {
      startStream();
    }
  });

  onUnmounted(() => {
    stopStream();
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    chartInstance.value?.dispose();
    chartInstance.value = null;
  });

  // 监听变化
  watch(() => getCode(), () => {
    initChart();
  });

  watch(() => getTheme(), (newTheme, oldTheme) => {
    if (newTheme !== oldTheme) {
      chartInstance.value?.dispose();
      chartInstance.value = null;
      initChart();
    }
  });

  watch(() => getEnableStreaming(), (enabled) => {
    if (enabled) {
      startStream();
    } else {
      stopStream();
    }
  });

  // 定期更新统计
  let statsInterval: ReturnType<typeof setInterval> | null = null;
  onMounted(() => {
    statsInterval = setInterval(() => {
      if (streamManager) {
        streamStats.value = streamManager.getStats();
      }
    }, 1000);
  });

  onUnmounted(() => {
    if (statsInterval) {
      clearInterval(statsInterval);
    }
  });

  // 公开方法
  const refresh = () => {
    const ds = getDataSource();
    if (ds?.type === 'polling') {
      stopStream();
      startStream();
    } else if (ds) {
      stopStream();
      startStream();
    }
  };

  const startStreaming = () => {
    startStream();
  };

  const stopStreaming = () => {
    stopStream();
  };

  const clearData = () => {
    dataManager?.clear();
  };

  return {
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
  };
}

// ==================== 辅助函数 ====================

function buildTimeSeriesUpdate(option: any, data: any[]): any {
  const xField = option.xAxis?.[0]?.name || 'timestamp';
  const series = option.series || [];
  const xData = data.map((row) => row[xField] || row.timestamp || '');

  const updatedSeries = series.map((s: any) => {
    const yField = s.name || 'value';
    return {
      ...s,
      data: data.map((row) => row[yField] || row.value || 0),
    };
  });

  return {
    xAxis: [{ ...option.xAxis?.[0], data: xData }],
    series: updatedSeries,
  };
}

function buildPieUpdate(option: any, data: any[]): any {
  const series = option.series || [];
  const nameField = 'name';
  const valueField = 'value';

  return {
    series: series.map((s: any) => ({
      ...s,
      data: data.map((row) => ({
        name: String(row[nameField] || row.category || ''),
        value: Number(row[valueField] || row.value || 0),
      })),
    })),
  };
}

function buildScatterUpdate(option: any, data: any[]): any {
  const series = option.series || [];

  return {
    series: series.map((s: any) => ({
      ...s,
      data: data.map((row) => [row.x || 0, row.y || 0]),
    })),
  };
}

function buildGaugeUpdate(option: any, data: any[]): any {
  const series = option.series || [];
  const latestData = data[data.length - 1] || {};

  return {
    series: series.map((s: any) => ({
      ...s,
      data: [{ value: latestData.value || 0, name: s.name || 'value' }],
    })),
  };
}

// ==================== 流式数据 Composable ====================

export interface UseStreamingDataOptions {
  dataSource: Ref<DataSourceConfig> | DataSourceConfig;
  autoStart?: boolean;
}

export interface UseStreamingDataReturn {
  isConnected: Ref<boolean>;
  isReceiving: Ref<boolean>;
  lastBatch: Ref<DataBatch | null>;
  stats: Ref<StreamStats | null>;
  start: () => void;
  stop: () => void;
  send: (data: any) => void;
}

export function useStreamingData(options: UseStreamingDataOptions): UseStreamingDataReturn {
  const { dataSource, autoStart = true } = options;

  let manager: DataStreamManager | null = null;

  const isConnected = ref(false);
  const isReceiving = ref(false);
  const lastBatch = ref<DataBatch | null>(null);
  const stats = ref<StreamStats | null>(null);

  const getDataSource = () => {
    return 'value' in dataSource ? dataSource.value : dataSource;
  };

  const start = () => {
    const ds = getDataSource();
    if (manager) {
      manager.destroy();
    }

    manager = new DataStreamManager(ds, {
      onData: (batch: DataBatch) => {
        lastBatch.value = batch;
        isReceiving.value = true;
      },
      onError: () => {
        isReceiving.value = false;
      },
      onConnect: () => {
        isConnected.value = true;
      },
      onDisconnect: () => {
        isConnected.value = false;
        isReceiving.value = false;
      },
    });

    manager.start();
  };

  const stop = () => {
    manager?.stop();
    isReceiving.value = false;
  };

  const send = (data: any) => {
    const ds = getDataSource();
    if (ds.type === 'websocket') {
      (manager as any)?.ws?.send(JSON.stringify(data));
    }
  };

  onMounted(() => {
    if (autoStart) {
      start();
    }

    // 定期更新统计
    const interval = setInterval(() => {
      if (manager) {
        stats.value = manager.getStats();
      }
    }, 1000);

    onUnmounted(() => {
      clearInterval(interval);
      manager?.destroy();
    });
  });

  return {
    isConnected,
    isReceiving,
    lastBatch,
    stats,
    start,
    stop,
    send,
  };
}