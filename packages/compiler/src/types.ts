// CDL AST Type Definitions (v0.7 - Unified Markdown Style)

export type QueryLanguage = 'sql' | 'dax' | 'data' | 'rest' | 'websocket';

export interface DataSourceConfig {
  source?: string;
  timeout?: number;
  cache?: number;
  params?: Record<string, unknown>;
}

export interface DataDefinition {
  type: 'data';
  name: string;
  lang: QueryLanguage;
  config: DataSourceConfig;
  query: string;
}

export type ChartType = string;

export interface SeriesConfig {
  field: string;
  as?: string;
  type?: ChartType;
  color?: string;
  axis?: 'left' | 'right';
  style?: 'solid' | 'dashed' | 'smooth' | 'marker';
}

export interface AxisConfig {
  position: 'x' | 'y' | 'x2' | 'y2' | 'left' | 'right' | 'top' | 'bottom';
  type?: 'category' | 'value' | 'time' | 'log';
  min?: number | string;
  max?: number | string;
  tickCount?: number;
  labelFormatter?: string;
  labelRotate?: number;
  splitLine?: boolean;
}

export interface InteractionConfig {
  tooltip?: 'single' | 'shared' | 'none';
  legend?: boolean;
  zoom?: boolean | 'inside' | 'slider';
  brush?: boolean;
}

export interface ChartHint {
  style?: string;
  color?: string;
  animation?: string;
  title?: string;
  subtitle?: string;
  layout?: string;
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  grid?: boolean;
  responsive?: boolean;
}

// Unified Chart Definition - Markdown Style Only
export interface ChartDefinition {
  type: 'chart';
  name: string;
  chartType: string;
  x: string;
  y: string;
  group?: string;
  stack?: string | boolean;
  series?: SeriesConfig[];
  axis?: AxisConfig[];
  interaction?: InteractionConfig;
  hints: ChartHint;
}

export interface CDLFile {
  version?: string;
  data: DataDefinition[];
  charts: ChartDefinition[];
}

export interface CompileError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
  suggestion?: string;
  context?: string;
}

export interface CompileResult {
  success: boolean;
  result?: CDLFile;
  errors: CompileError[];
}

export interface ValidationResult {
  valid: boolean;
  errors: CompileError[];
}
