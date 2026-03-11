/**
 * CDL AST Type Definitions
 * CDL 编译器的 TypeScript 类型定义
 */
export type QueryLanguage = 'sql' | 'dax' | 'data';
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
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'combo' | 'radar' | 'heatmap' | 'gauge' | 'candlestick' | 'boxplot' | 'sankey' | 'treemap' | 'wordcloud' | 'liquid' | 'map';
export interface ChartSeries {
    name: string;
    type?: ChartType;
    yField: string;
    xField?: string;
    axis?: 'left' | 'right';
    style?: 'solid' | 'dashed' | 'background' | 'marker';
}
export interface ChartHint {
    style?: string;
    color?: string;
    animation?: string;
    interaction?: string;
    title?: string;
    layout?: string;
}
export interface ChartDefinition {
    type: 'chart';
    name?: string;
    chartType: ChartType;
    dataSources: string[];
    x?: string;
    y?: string;
    group?: string;
    stack?: string | boolean;
    series?: ChartSeries[];
    where?: string;
    hints: ChartHint;
}
export interface CDLFile {
    data: DataDefinition[];
    charts: ChartDefinition[];
}
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
//# sourceMappingURL=types.d.ts.map