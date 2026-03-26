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
  transform?: DataTransform; // 数据转换管道
}

// 数据转换管道
export interface DataTransform {
  filters?: TransformFilter[];    // 过滤操作
  aggregates?: TransformAggregate[]; // 聚合操作
  sorts?: TransformSort[];       // 排序操作
  limits?: TransformLimit;       // 限制操作
  columns?: TransformColumn[];   // 列操作（重命名、计算）
}

export interface TransformFilter {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'contains';
  value: any;
}

export interface TransformAggregate {
  groupBy: string[];      // 分组字段
  aggregations: Array<{   // 聚合函数
    field: string;
    as: string;           // 输出字段名
    fn: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
  }>;
}

export interface TransformSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TransformLimit {
  count: number;
  offset?: number;
}

export interface TransformColumn {
  // 重命名: { from: 'old', to: 'new' }
  // 计算: { as: 'new', expression: 'field1 + field2' }
  type: 'rename' | 'compute';
  from?: string;
  to?: string;
  expression?: string;
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
  // v0.2+ 新增交互
  drillDown?: boolean | { 
    field?: string;      // 下钻字段（默认使用 group 或分类字段）
    maxLevels?: number;  // 最大下钻层级
    breadcrumb?: boolean; // 显示面包屑导航
  };
  link?: string[] | { 
    charts?: string[];    // 联动的其他图表ID
    group?: string;       // 联动字段（默认使用 group）
    highlight?: 'both' | 'source'; // 高亮模式
  };
  live?: boolean | number | 'stream';  // true=默认间隔, number=毫秒, stream=WebSocket
  animation?: {
    easing?: string;      // 缓动函数: linear, easeIn, easeOut, elastic...
    duration?: number;    // 动画时长(ms)
    delay?: number;       // 延迟(ms)
    loop?: boolean;       // 循环播放
  };
}

export interface ChartHint {
  style?: string;       // @style "..."
  color?: string;       // @color "..."
  animation?: string;   // @animation "..."
  title?: string;       // @title "..."
  subtitle?: string;    // @subtitle "..."
  layout?: string;      // @layout "..."
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;      // @locale "..." - i18n语言设置
  grid?: boolean;
  responsive?: boolean; // @responsive true - 启用自适应容器尺寸
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
  code?: string;              // 错误代码，便于查找文档
  suggestion?: string;        // 可操作的修复建议
  context?: string;           // 相关代码片段
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