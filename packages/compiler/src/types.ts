// CDL AST Type Definitions (v0.6)

// ===== 数据源相关 =====

export type QueryLanguage = 'sql' | 'dax' | 'data' | 'rest' | 'websocket';

export interface DataSourceConfig {
  source?: string;      // @source('...')
  timeout?: number;     // @timeout(n)
  cache?: number;       // @cache(n)
  params?: Record<string, unknown>; // @params({...})
}

export interface DataDefinition {
  type: 'data';
  name: string;
  lang: QueryLanguage;
  config: DataSourceConfig;
  query: string;        // 原始查询内容
}

// ===== 图表相关 =====

// 允许任意字符串以支持动态类型
export type ChartType = string;

// v0.6 新增：系列配置
export interface SeriesConfig {
  field: string;        // 数据列名（必需）
  as?: string;          // 系列显示名称
  type?: ChartType;     // 系列图表类型（combo 混合）
  color?: string;       // HEX 颜色
  axis?: 'left' | 'right'; // 坐标轴位置
  style?: 'solid' | 'dashed' | 'smooth' | 'marker';
}

// v0.6 新增：坐标轴配置
export interface AxisConfig {
  position: 'x' | 'y' | 'x2' | 'y2' | 'left' | 'right' | 'top' | 'bottom';
  type?: 'category' | 'value' | 'time' | 'log';
  min?: number | string;
  max?: number | string;
  tickCount?: number;
  labelFormatter?: string;   // ${value} 插值
  labelRotate?: number;      // 旋转角度
  splitLine?: boolean;       // 网格线
}

// v0.6 新增：交互配置
export interface InteractionConfig {
  tooltip?: 'single' | 'shared' | 'none';
  legend?: boolean;
  zoom?: boolean | 'inside' | 'slider' | { type: 'inside' | 'slider' };
  brush?: boolean | { connect?: string[]; link?: Record<string, string[]> };
}

export interface ChartHint {
  style?: string;       // @style "..."
  color?: string;       // @color "..."
  animation?: string;   // @animation "..."
  title?: string;       // @title "..."
  subtitle?: string;    // @subtitle "..."
  layout?: string;      // @layout "..."
  theme?: 'light' | 'dark' | 'auto';
  grid?: boolean;
  interaction?: string; // 临时存储，后面会解析为 InteractionConfig
}

export interface ChartDefinition {
  type: 'chart';
  name?: string;
  chartType: string;
  dataSources: string[];
  x?: string;
  y?: string;
  group?: string;
  stack?: string | boolean;
  series?: SeriesConfig[];
  axis?: AxisConfig[];
  interaction?: InteractionConfig;
  where?: string;
  hints: ChartHint;
}

// ===== CDL 文件结构 =====

export interface CDLFile {
  version?: string;
  data: DataDefinition[];
  charts: ChartDefinition[];
}

// ===== 编译错误 =====

export interface CompileError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
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