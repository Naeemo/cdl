/**
 * CDL AST Type Definitions
 * CDL 编译器的 TypeScript 类型定义
 */

// ===== 数据源相关 =====

export type QueryLanguage = 'sql' | 'dax' | 'data';

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

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'scatter' 
  | 'area' 
  | 'combo' 
  | 'radar' 
  | 'heatmap'
  | 'gauge'
  | 'candlestick'
  | 'boxplot'
  | 'sankey'
  | 'treemap'
  | 'wordcloud'
  | 'liquid'
  | 'map';

export interface ChartSeries {
  name: string;
  type?: ChartType;
  yField: string;
  xField?: string;
  axis?: 'left' | 'right';
  style?: 'solid' | 'dashed' | 'background' | 'marker';
}

export interface ChartHint {
  style?: string;       // @style "..."
  color?: string;       // @color "..."
  animation?: string;   // @animation "..."
  interaction?: string; // @interaction "..."
  title?: string;       // @title "..."
  layout?: string;      // @layout "..."
}

export interface ChartDefinition {
  type: 'chart';
  name?: string;
  chartType: ChartType;
  dataSources: string[];  // use DataName
  x?: string;
  y?: string;
  group?: string;
  stack?: string | boolean;
  series?: ChartSeries[];
  where?: string;
  hints: ChartHint;
}

// ===== CDL 文件结构 =====

export interface CDLFile {
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
