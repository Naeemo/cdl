import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

// ==================== 类型定义 ====================

export interface UseDynamicChartOptions {
  /** CDL 代码 */
  code: string;
  /** 图表主题 */
  theme?: 'light' | 'dark';
  /** 数据源配置 */
  dataSource?: DataSourceConfig;
  /** 轮询间隔（毫秒），如不设置则使用数据源配置 */
  refreshInterval?: number;
  /** 是否启用流式更新 */
  enableStreaming?: boolean;
  /** 数据更新策略 */
  updateStrategy?: ChartUpdateStrategy | 'append' | 'replace' | 'timeseries';
  /** 时间序列字段名（当策略为 timeseries 时使用） */
  timeField?: string;
  /** 最大数据点数量 */
  maxDataPoints?: number;
  /** 编译错误回调 */
  onCompileError?: (error: string) => void;
  /** 数据更新回调 */
  onDataUpdate?: (state: ChartDataState) => void;
  /** 连接状态变化回调 */
  onConnectionChange?: (connected: boolean) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export interface UseDynamicChartReturn {
  /** 图表容器 ref */
  chartRef: React.RefObject<HTMLDivElement>;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在流式接收数据 */
  isStreaming: boolean;
  /** 是否已连接 */
  isConnected: boolean;
  /** 错误信息 */
  error: string | null;
  /** 当前数据状态 */
  dataState: ChartDataState;
  /** 流统计信息 */
  streamStats: StreamStats | null;
  /** 手动刷新 */
  refresh: () => void;
  /** 开始流式更新 */
  startStreaming: () => void;
  /** 停止流式更新 */
  stopStreaming: () => void;
  /** 清空数据 */
  clearData: () => void;
}

// ==================== 主 Hook ====================

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
    onCompileError,
    onDataUpdate,
    onConnectionChange,
    onError,
  } = options;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const streamManager = useRef<DataStreamManager | null>(null);
  const dataManager = useRef<ChartDataManager | null>(null);
  const cdlOption = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataState, setDataState] = useState<ChartDataState>({
    data: [],
    lastUpdate: null,
    updateCount: 0,
  });
  const [streamStats, setStreamStats] = useState<StreamStats | null>(null);

  // 解析更新策略
  const strategy = useMemo<ChartUpdateStrategy>(() => {
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
  }, [updateStrategy, timeField, maxDataPoints]);

  // 初始化数据管理器
  useEffect(() => {
    dataManager.current = new ChartDataManager(strategy);
    const unsubscribe = dataManager.current.subscribe((state) => {
      setDataState(state);
      onDataUpdate?.(state);
      updateChartData(state.data);
    });

    return () => {
      unsubscribe();
      dataManager.current = null;
    };
  }, [strategy, onDataUpdate]);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current || !code) return;

    const initChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 使用 @cdl/core 的动态导入
        const core = await import('@cdl/core');
        const compileResult = core.compile(code);
        if (compileResult.errors.length > 0) {
          const errorMsg = compileResult.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
          throw new Error(errorMsg);
        }

        const renderResult = core.render(compileResult.file, theme);
        if (!renderResult.success) {
          throw new Error(renderResult.error || 'Render failed');
        }

        cdlOption.current = renderResult.option;

        // 初始化 ECharts
        if (!chartInstance.current) {
          chartInstance.current = echarts.init(chartRef.current, theme);
          window.addEventListener('resize', handleResize);
        }

        // 使用 setOption 而不是完全替换
        chartInstance.current.setOption(renderResult.option, true);

        setIsLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setIsLoading(false);
        onCompileError?.(errorMsg);
      }
    };

    initChart();

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [code, theme, onCompileError]);

  // 处理数据流
  useEffect(() => {
    if (!enableStreaming || !dataSource) return;

    const config: DataSourceConfig = {
      ...dataSource,
      interval: refreshInterval || dataSource.interval,
    };

    streamManager.current = new DataStreamManager(config, {
      onData: (batch: DataBatch) => {
        dataManager.current?.update(batch);
      },
      onError: (err: Error) => {
        setError(err.message);
        onError?.(err);
      },
      onConnect: () => {
        setIsConnected(true);
        setIsStreaming(true);
        onConnectionChange?.(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setIsStreaming(false);
        onConnectionChange?.(false);
      },
    });

    streamManager.current.start();

    // 定期更新统计信息
    const statsInterval = setInterval(() => {
      if (streamManager.current) {
        setStreamStats(streamManager.current.getStats());
      }
    }, 1000);

    return () => {
      streamManager.current?.destroy();
      streamManager.current = null;
      clearInterval(statsInterval);
    };
  }, [enableStreaming, dataSource, refreshInterval, onError, onConnectionChange]);

  // 更新图表数据
  const updateChartData = useCallback((data: any[]) => {
    if (!chartInstance.current || !cdlOption.current || data.length === 0) return;

    // 获取图表类型和配置
    const series = cdlOption.current.series;
    if (!series || series.length === 0) return;

    // 根据图表类型更新数据
    const firstSeries = series[0];
    const chartType = firstSeries.type;

    let newOption: any = {};

    switch (chartType) {
      case 'line':
      case 'bar':
      case 'area':
        // 时间序列图表：更新 xAxis 和 series 数据
        newOption = buildTimeSeriesUpdate(cdlOption.current, data);
        break;
      case 'pie':
      case 'funnel':
        // 占比图表：更新数据
        newOption = buildPieUpdate(cdlOption.current, data);
        break;
      case 'scatter':
        newOption = buildScatterUpdate(cdlOption.current, data);
        break;
      case 'gauge':
        newOption = buildGaugeUpdate(cdlOption.current, data);
        break;
      default:
        // 默认策略：更新 series 数据
        newOption = {
          series: series.map((s: any, idx: number) => ({
            ...s,
            data: data.map((row: any) => row[s.field || `value${idx}`] || row.value || 0),
          })),
        };
    }

    // 使用 notMerge: false 实现增量更新
    chartInstance.current.setOption(newOption, false, true);
  }, []);

  // 工具函数：处理窗口大小变化
  const handleResize = useCallback(() => {
    chartInstance.current?.resize();
  }, []);

  // 手动刷新
  const refresh = useCallback(() => {
    if (dataSource?.type === 'polling') {
      // 对于轮询模式，立即触发一次轮询
      streamManager.current?.stop();
      streamManager.current?.start();
    } else if (dataSource) {
      // 对于其他模式，重启连接
      streamManager.current?.stop();
      streamManager.current?.start();
    }
  }, [dataSource]);

  // 开始流式更新
  const startStreaming = useCallback(() => {
    if (dataSource && streamManager.current) {
      streamManager.current.start();
      setIsStreaming(true);
    }
  }, [dataSource]);

  // 停止流式更新
  const stopStreaming = useCallback(() => {
    streamManager.current?.stop();
    setIsStreaming(false);
  }, []);

  // 清空数据
  const clearData = useCallback(() => {
    dataManager.current?.clear();
  }, []);

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

// ==================== 辅助函数：构建更新配置 ====================

function buildTimeSeriesUpdate(option: any, data: any[]): any {
  const xField = option.xAxis?.[0]?.name || 'timestamp';
  const series = option.series || [];

  // 提取 X 轴数据
  const xData = data.map(row => row[xField] || row.timestamp || '');

  // 更新每个 series
  const updatedSeries = series.map((s: any) => {
    const yField = s.name || 'value';
    return {
      ...s,
      data: data.map(row => row[yField] || row.value || 0),
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
      data: data.map(row => ({
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
      data: data.map(row => [row.x || 0, row.y || 0]),
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

// ==================== 流式数据 Hook ====================

export interface UseStreamingDataOptions {
  dataSource: DataSourceConfig;
  autoStart?: boolean;
  onData?: (batch: DataBatch) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
}

export interface UseStreamingDataReturn {
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否正在接收数据 */
  isReceiving: boolean;
  /** 最新数据批次 */
  lastBatch: DataBatch | null;
  /** 统计信息 */
  stats: StreamStats | null;
  /** 开始接收 */
  start: () => void;
  /** 停止接收 */
  stop: () => void;
  /** 发送数据（仅 WebSocket 模式） */
  send: (data: any) => void;
}

export function useStreamingData(options: UseStreamingDataOptions): UseStreamingDataReturn {
  const { dataSource, autoStart = true, onData, onError, onConnect, onDisconnect } = options;

  const manager = useRef<DataStreamManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [lastBatch, setLastBatch] = useState<DataBatch | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);

  useEffect(() => {
    manager.current = new DataStreamManager(dataSource, {
      onData: (batch) => {
        setLastBatch(batch);
        setIsReceiving(true);
        onData?.(batch);
      },
      onError: (err) => {
        setIsReceiving(false);
        onError?.(err);
      },
      onConnect: () => {
        setIsConnected(true);
        onConnect?.();
      },
      onDisconnect: (reason) => {
        setIsConnected(false);
        setIsReceiving(false);
        onDisconnect?.(reason);
      },
    });

    if (autoStart) {
      manager.current.start();
    }

    // 定期更新统计
    const interval = setInterval(() => {
      if (manager.current) {
        setStats(manager.current.getStats());
      }
    }, 1000);

    return () => {
      manager.current?.destroy();
      clearInterval(interval);
    };
  }, [dataSource, autoStart, onData, onError, onConnect, onDisconnect]);

  const start = useCallback(() => {
    manager.current?.start();
  }, []);

  const stop = useCallback(() => {
    manager.current?.stop();
    setIsReceiving(false);
  }, []);

  const send = useCallback((data: any) => {
    // 仅 WebSocket 支持发送
    if (dataSource.type === 'websocket') {
      // 通过内部 ws 发送
      (manager.current as any)?.ws?.send(JSON.stringify(data));
    }
  }, [dataSource.type]);

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