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
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'combo' | 'radar' | 'heatmap';
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
    theme?: string;
}
export interface ThemeColors {
    primary: string[];
    background?: string;
    text?: string;
    grid?: string;
}
export declare const defaultThemes: Record<string, ThemeColors>;
export interface EChartsOption {
    title?: {
        text?: string;
        left?: string;
        top?: string;
    };
    tooltip?: {
        trigger?: string;
    };
    legend?: {
        data?: string[];
        bottom?: string;
    };
    grid?: {
        left?: string;
        right?: string;
        top?: string;
        bottom?: string;
        containLabel?: boolean;
    };
    xAxis?: {
        type?: string;
        data?: string[];
        name?: string;
    };
    yAxis?: any;
    series?: any[];
    color?: string[];
    animation?: boolean;
    animationDuration?: number;
    radar?: any;
    visualMap?: any;
    backgroundColor?: string;
    textStyle?: {
        color?: string;
    };
}
export interface RenderResult {
    success: boolean;
    option?: EChartsOption;
    error?: string;
}
/**
 * CDL ECharts Renderer
 * Convert CDL AST to ECharts option
 */
export declare function render(cdlFile: CDLFile, themeName?: string): RenderResult;
//# sourceMappingURL=index.d.ts.map