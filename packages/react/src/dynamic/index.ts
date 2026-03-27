// Dynamic chart components
export { DynamicCDLChart } from './DynamicCDLChart';
export type { DynamicCDLChartProps } from './DynamicCDLChart';

// Embedded core types
export type {
  DataSourceConfig,
  DataBatch,
  StreamStats,
  ChartDataState,
  ChartUpdateStrategy,
  DataPoint,
  DataStreamType,
} from '../core';

export {
  DataStreamManager,
  ChartDataManager,
  defaultUpdateStrategy,
  timeSeriesUpdateStrategy,
} from '../core';

// Import hooks from dynamic.ts
export { useDynamicChart, useStreamingData } from './dynamic';
export type {
  UseDynamicChartOptions,
  UseDynamicChartReturn,
  UseStreamingDataOptions,
  UseStreamingDataReturn,
} from './dynamic';