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
}

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
export function render(cdlFile: CDLFile): RenderResult {
  if (cdlFile.charts.length === 0) {
    return { success: false, error: 'No chart definition found' };
  }

  const chart = cdlFile.charts[0];
  const dataMap = buildDataMap(cdlFile.data);

  try {
    const option = convertChartToECharts(chart, dataMap);
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
  dataMap: Map<string, DataDefinition>
): EChartsOption {
  const option: EChartsOption = {
    animation: true,
    animationDuration: 1000,
  };

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
      convertLineChart(chart, option);
      break;
    case 'bar':
      convertBarChart(chart, option);
      break;
    case 'pie':
      convertPieChart(chart, option);
      break;
    case 'scatter':
      convertScatterChart(chart, option);
      break;
    case 'area':
      convertAreaChart(chart, option);
      break;
    case 'radar':
      convertRadarChart(chart, option);
      break;
    case 'combo':
      convertComboChart(chart, option);
      break;
    case 'heatmap':
      convertHeatmapChart(chart, option);
      break;
    default:
      // Default to line
      convertLineChart(chart, option);
  }

  // Apply style hints
  applyStyleHints(chart, option);

  return option;
}

function convertLineChart(chart: ChartDefinition, option: EChartsOption): void {
  option.xAxis = {
    type: 'category',
    data: [], // Will be filled with actual data
    name: chart.x || '',
  };
  option.yAxis = {
    type: 'value',
    name: chart.y || '',
  };

  option.series = [{
    name: chart.y || 'value',
    type: 'line',
    data: [], // Will be filled with actual data
    smooth: chart.hints?.style?.includes('平滑') ?? false,
    symbol: chart.hints?.style?.includes('标记') ? 'circle' : 'none',
  }];

  // Handle group (multi-series)
  if (chart.group) {
    option.legend = { data: [] };
  }
}

function convertBarChart(chart: ChartDefinition, option: EChartsOption): void {
  option.xAxis = {
    type: chart.stack ? 'category' : 'category',
    data: [],
    name: chart.x || '',
  };
  option.yAxis = {
    type: 'value',
    name: chart.y || '',
  };

  option.series = [{
    name: chart.y || 'value',
    type: 'bar',
    data: [],
    stack: chart.stack === true ? 'total' : chart.stack || undefined,
  }];
}

function convertPieChart(chart: ChartDefinition, option: EChartsOption): void {
  option.series = [{
    name: chart.hints?.title || 'data',
    type: 'pie',
    radius: chart.hints?.style?.includes('环形') ? ['40%', '70%'] : '60%',
    data: [],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  }];
}

function convertScatterChart(chart: ChartDefinition, option: EChartsOption): void {
  option.xAxis = {
    type: 'value',
    name: chart.x || '',
  };
  option.yAxis = {
    type: 'value',
    name: chart.y || '',
  };

  option.series = [{
    name: 'data',
    type: 'scatter',
    data: [],
    symbolSize: 10,
  }];
}

function convertAreaChart(chart: ChartDefinition, option: EChartsOption): void {
  option.xAxis = {
    type: 'category',
    data: [],
    name: chart.x || '',
  };
  option.yAxis = {
    type: 'value',
    name: chart.y || '',
  };

  option.series = [{
    name: chart.y || 'value',
    type: 'line',
    data: [],
    areaStyle: {},
    smooth: chart.hints?.style?.includes('平滑') ?? false,
    stack: chart.stack === true ? 'total' : chart.stack || undefined,
  }];
}

function convertRadarChart(chart: ChartDefinition, option: EChartsOption): void {
  option.radar = {
    indicator: [],
  };
  option.series = [{
    name: chart.hints?.title || 'radar',
    type: 'radar',
    data: [],
  }];
}

function convertComboChart(chart: ChartDefinition, option: EChartsOption): void {
  option.xAxis = {
    type: 'category',
    data: [],
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
    data: [],
  })) || [];
}

function convertHeatmapChart(chart: ChartDefinition, option: EChartsOption): void {
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
