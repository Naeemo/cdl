// Local type definitions to avoid import issues
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

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'scatter' 
  | 'area' 
  | 'combo' 
  | 'radar' 
  | 'heatmap';

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

// Theme configuration
export interface ThemeColors {
  primary: string[];
  background?: string;
  text?: string;
  grid?: string;
}

export const defaultThemes: Record<string, ThemeColors> = {
  light: {
    primary: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
    background: '#ffffff',
    text: '#333333',
    grid: '#e0e0e0',
  },
  dark: {
    primary: ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3'],
    background: '#1a1a2e',
    text: '#e0e0e0',
    grid: '#333344',
  },
};

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
export function render(cdlFile: CDLFile, themeName?: string): RenderResult {
  if (cdlFile.charts.length === 0) {
    return { success: false, error: 'No chart definition found' };
  }

  const chart = cdlFile.charts[0];
  const dataMap = buildDataMap(cdlFile.data);
  
  // Support @theme directive from CDL file or parameter
  const effectiveTheme = themeName || cdlFile.theme || 'light';

  try {
    const option = convertChartToECharts(chart, dataMap, effectiveTheme);
    return { success: true, option };
  } catch (e) {
    return { 
      success: false, 
      error: e instanceof Error ? e.message : 'Unknown error' 
    };
  }
}

function buildDataMap(dataDefinitions: DataDefinition[]): Map<string, DataDefinition> {
  const map = new Map<string, DataDefinition>();
  for (const data of dataDefinitions) {
    map.set(data.name, data);
  }
  return map;
}

function convertChartToECharts(
  chart: ChartDefinition, 
  dataMap: Map<string, DataDefinition>,
  themeName: string = 'light'
): EChartsOption {
  const theme = defaultThemes[themeName] || defaultThemes.light;
  
  const option: EChartsOption = {
    animation: true,
    animationDuration: 1000,
    backgroundColor: theme.background,
    textStyle: {
      color: theme.text,
    },
    color: theme.primary,
  };

  // Get data from first data source
  const dataDef = chart.dataSources.length > 0 ? dataMap.get(chart.dataSources[0]) : undefined;
  const { headers, rows } = dataDef ? parseStaticData(dataDef.query) : { headers: [], rows: [] };

  // Title from hints
  if (chart.hints?.title) {
    option.title = {
      text: chart.hints.title,
      left: 'center',
      top: '10',
    };
  }

  // Tooltip
  option.tooltip = {
    trigger: chart.chartType === 'pie' ? 'item' : 'axis',
  };

  // Grid for non-pie charts
  if (chart.chartType !== 'pie' && chart.chartType !== 'radar') {
    option.grid = {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    };
  }

  // Colors from hints
  if (chart.hints?.color) {
    option.color = parseColors(chart.hints.color);
  }

  // Convert based on chart type
  switch (chart.chartType) {
    case 'line':
      convertLineChart(chart, option, headers, rows);
      break;
    case 'bar':
      convertBarChart(chart, option, headers, rows);
      break;
    case 'pie':
      convertPieChart(chart, option, headers, rows);
      break;
    case 'scatter':
      convertScatterChart(chart, option, headers, rows);
      break;
    case 'area':
      convertAreaChart(chart, option, headers, rows);
      break;
    case 'radar':
      convertRadarChart(chart, option, headers, rows);
      break;
    case 'combo':
      convertComboChart(chart, option, headers, rows);
      break;
    case 'heatmap':
      convertHeatmapChart(chart, option, headers, rows);
      break;
    default:
      // Default to line
      convertLineChart(chart, option, headers, rows);
  }

  // Apply style hints
  applyStyleHints(chart, option);

  return option;
}

/**
 * Parse static data from CSV-like format
 */
function parseStaticData(query: string): { headers: string[]; rows: Record<string, string | number>[] } {
  const lines = query.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 1) {
    return { headers: [], rows: [] };
  }

  // First line is headers
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Rest are data rows
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const val = values[i] || '';
      // Try to parse as number
      const num = Number(val);
      row[h] = isNaN(num) ? val : num;
    });
    return row;
  });

  return { headers, rows };
}

function convertLineChart(
  chart: ChartDefinition, 
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = {
    type: 'category',
    data: rows.map(r => String(r[xField] || '')),
    name: xField,
  };
  option.yAxis = {
    type: 'value',
    name: yField,
  };

  option.series = [{
    name: yField,
    type: 'line',
    data: rows.map(r => Number(r[yField]) || 0),
    smooth: chart.hints?.style?.includes('平滑') ?? false,
    symbol: chart.hints?.style?.includes('标记') ? 'circle' : 'none',
  }];

  // Handle group (multi-series)
  if (chart.group) {
    option.legend = { data: [] };
  }
}

function convertBarChart(
  chart: ChartDefinition, 
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = {
    type: 'category',
    data: rows.map(r => String(r[xField] || '')),
    name: xField,
  };
  option.yAxis = {
    type: 'value',
    name: yField,
  };

  option.series = [{
    name: yField,
    type: 'bar',
    data: rows.map(r => Number(r[yField]) || 0),
    stack: chart.stack === true ? 'total' : chart.stack || undefined,
  }];
}

function convertPieChart(
  chart: ChartDefinition,
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  option.series = [{
    name: chart.hints?.title || 'data',
    type: 'pie',
    radius: chart.hints?.style?.includes('环形') ? ['40%', '70%'] : '60%',
    data: rows.map(r => ({
      name: String(r[nameField] || ''),
      value: Number(r[valueField]) || 0,
    })),
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  }];
}

function convertScatterChart(
  chart: ChartDefinition,
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = {
    type: 'value',
    name: xField,
  };
  option.yAxis = {
    type: 'value',
    name: yField,
  };

  option.series = [{
    name: 'data',
    type: 'scatter',
    data: rows.map(r => [Number(r[xField]) || 0, Number(r[yField]) || 0]),
    symbolSize: 10,
  }];
}

function convertAreaChart(
  chart: ChartDefinition,
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = {
    type: 'category',
    data: rows.map(r => String(r[xField] || '')),
    name: xField,
  };
  option.yAxis = {
    type: 'value',
    name: yField,
  };

  option.series = [{
    name: yField,
    type: 'line',
    data: rows.map(r => Number(r[yField]) || 0),
    areaStyle: {},
    smooth: chart.hints?.style?.includes('平滑') ?? false,
    stack: chart.stack === true ? 'total' : chart.stack || undefined,
  }];
}

function convertRadarChart(
  chart: ChartDefinition,
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const dimField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  const maxValue = Math.max(...rows.map(r => Number(r[valueField]) || 0)) * 1.2;

  option.radar = {
    indicator: rows.map(r => ({
      name: String(r[dimField] || ''),
      max: maxValue,
    })),
  };
  option.series = [{
    name: chart.hints?.title || 'radar',
    type: 'radar',
    data: [{
      value: rows.map(r => Number(r[valueField]) || 0),
      name: valueField,
    }],
  }];
}

function convertComboChart(
  chart: ChartDefinition,
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';

  option.xAxis = {
    type: 'category',
    data: rows.map(r => String(r[xField] || '')),
  };
  option.yAxis = [
    {
      type: 'value',
      name: 'left',
    },
    {
      type: 'value',
      name: 'right',
    },
  ];

  option.series = chart.series?.map(s => ({
    name: s.name,
    type: s.type || 'line',
    yAxisIndex: s.axis === 'right' ? 1 : 0,
    data: rows.map(r => Number(r[s.yField]) || 0),
  })) || [];
}

function convertHeatmapChart(
  chart: ChartDefinition,
  option: EChartsOption,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  option.xAxis = {
    type: 'category',
    data: [],
  };
  option.yAxis = {
    type: 'category',
    data: [],
  };
  option.visualMap = {
    min: 0,
    max: 100,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',
  };
  option.series = [{
    name: 'heatmap',
    type: 'heatmap',
    data: [],
    label: {
      show: true,
    },
  }];
}

function parseColors(colorHint: string): string[] {
  // Parse color hints like "#4fc3f7, #29b6f6" or "blue, red, green"
  const hexMatches = colorHint.match(/#[0-9a-fA-F]{6}/g);
  if (hexMatches) {
    return hexMatches;
  }
  return ['#4fc3f7', '#29b6f6', '#66bb6a', '#ffa726', '#ef5350'];
}

function applyStyleHints(chart: ChartDefinition, option: EChartsOption): void {
  const style = chart.hints?.style || '';

  // Animation
  if (chart.hints?.animation) {
    if (chart.hints.animation.includes('从')) {
      option.animationDuration = 1500;
    }
  }
}
