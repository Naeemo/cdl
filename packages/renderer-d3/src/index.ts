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

// D3.js specific types
export interface D3Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface D3Scale {
  type: 'linear' | 'band' | 'ordinal' | 'point' | 'time';
  domain: (string | number | Date)[];
  range: (string | number)[];
}

export interface D3Axis {
  position: 'bottom' | 'top' | 'left' | 'right';
  scale: string;
  title?: string;
  tickCount?: number;
}

export interface D3Series {
  name: string;
  type: ChartType;
  xField: string;
  yField: string;
  color?: string;
  curve?: 'linear' | 'monotone' | 'step' | 'basis';
  style?: Record<string, unknown>;
}

export interface D3Animation {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

export interface D3Spec {
  type: ChartType;
  width: number;
  height: number;
  margin: D3Margin;
  title?: {
    text: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  };
  scales: Record<string, D3Scale>;
  axes: D3Axis[];
  series: D3Series[];
  data: Record<string, unknown>[];
  animation?: D3Animation;
  colorScheme?: string[];
  legend?: {
    position: 'top' | 'right' | 'bottom' | 'left';
    orientation: 'horizontal' | 'vertical';
  };
  tooltip?: {
    enabled: boolean;
    format?: string;
  };
}

export interface RenderResult {
  success: boolean;
  spec?: D3Spec;
  error?: string;
}

/**
 * CDL D3.js Renderer
 * Convert CDL AST to D3.js rendering specification
 */
export function render(cdlFile: CDLFile, theme?: string): RenderResult {
  if (cdlFile.charts.length === 0) {
    return { success: false, error: 'No chart definition found' };
  }

  const chart = cdlFile.charts[0];
  const dataMap = buildDataMap(cdlFile.data);

  try {
    const spec = convertChartToD3(chart, dataMap, theme);
    return { success: true, spec };
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

function convertChartToD3(
  chart: ChartDefinition,
  dataMap: Map<string, DataDefinition>,
  themeName?: string
): D3Spec {
  // Get data from first data source
  const dataDef = chart.dataSources.length > 0 ? dataMap.get(chart.dataSources[0]) : undefined;
  const { headers, rows } = dataDef ? parseStaticData(dataDef.query) : { headers: [], rows: [] };

  // Get theme colors
  const colorScheme = getThemeColors(themeName, chart.hints?.color);

  // Base D3 spec
  const spec: D3Spec = {
    type: chart.chartType,
    width: 800,
    height: 400,
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    scales: {},
    axes: [],
    series: [],
    data: rows,
    animation: {
      enabled: true,
      duration: 750,
      easing: 'ease-out',
    },
    colorScheme,
    legend: {
      position: 'bottom',
      orientation: 'horizontal',
    },
    tooltip: {
      enabled: true,
    },
  };

  // Title
  if (chart.hints?.title) {
    spec.title = {
      text: chart.hints.title,
      fontSize: 16,
      fontWeight: 'bold',
    };
  }

  // Convert based on chart type
  switch (chart.chartType) {
    case 'line':
      convertLineChart(chart, spec, headers, rows);
      break;
    case 'bar':
      convertBarChart(chart, spec, headers, rows);
      break;
    case 'pie':
      convertPieChart(chart, spec, headers, rows);
      break;
    case 'scatter':
      convertScatterChart(chart, spec, headers, rows);
      break;
    case 'area':
      convertAreaChart(chart, spec, headers, rows);
      break;
    case 'radar':
      convertRadarChart(chart, spec, headers, rows);
      break;
    case 'combo':
      convertComboChart(chart, spec, headers, rows);
      break;
    case 'heatmap':
      convertHeatmapChart(chart, spec, headers, rows);
      break;
    default:
      convertLineChart(chart, spec, headers, rows);
  }

  // Apply style hints
  applyStyleHints(chart, spec);

  return spec;
}

/**
 * Parse static data from CSV-like format
 */
function parseStaticData(query: string): { headers: string[]; rows: Record<string, string | number>[] } {
  const lines = query.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 1) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const val = values[i] || '';
      const num = Number(val);
      row[h] = isNaN(num) ? val : num;
    });
    return row;
  });

  return { headers, rows };
}

function convertLineChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  // X scale - band for discrete categories
  const xValues = rows.map(r => String(r[xField]));
  spec.scales.x = {
    type: 'band',
    domain: xValues,
    range: [0, spec.width - spec.margin.left - spec.margin.right],
  };

  // Y scale - linear for numeric values
  const yValues = rows.map(r => Number(r[yField]) || 0);
  const yMax = Math.max(...yValues) * 1.1;
  spec.scales.y = {
    type: 'linear',
    domain: [0, yMax],
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.axes = [
    { position: 'bottom', scale: 'x', title: xField },
    { position: 'left', scale: 'y', title: yField },
  ];

  spec.series = [{
    name: yField,
    type: 'line',
    xField,
    yField,
    curve: chart.hints?.style?.includes('平滑') ? 'monotone' : 'linear',
  }];
}

function convertBarChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  const xValues = rows.map(r => String(r[xField]));
  const yValues = rows.map(r => Number(r[yField]) || 0);
  const yMax = Math.max(...yValues) * 1.1;

  spec.scales.x = {
    type: 'band',
    domain: xValues,
    range: [0, spec.width - spec.margin.left - spec.margin.right],
  };

  spec.scales.y = {
    type: 'linear',
    domain: [0, yMax],
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.axes = [
    { position: 'bottom', scale: 'x', title: xField },
    { position: 'left', scale: 'y', title: yField },
  ];

  spec.series = [{
    name: yField,
    type: 'bar',
    xField,
    yField,
    style: {
      padding: 0.1,
    },
  }];
}

function convertPieChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  // Pie charts don't need axes
  spec.axes = [];
  spec.scales = {};

  // Calculate total for percentages
  const total = rows.reduce((sum, r) => sum + (Number(r[valueField]) || 0), 0);

  spec.series = [{
    name: valueField,
    type: 'pie',
    xField: nameField,
    yField: valueField,
    style: {
      innerRadius: chart.hints?.style?.includes('环形') ? 0.4 : 0,
      cornerRadius: 4,
      padAngle: 0.02,
    },
  }];

  // Add percentage to data
  spec.data = rows.map(r => ({
    ...r,
    _percentage: ((Number(r[valueField]) || 0) / total) * 100,
  }));

  // Adjust margins for pie
  spec.margin = { top: 40, right: 150, bottom: 40, left: 40 };
}

function convertScatterChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  const xValues = rows.map(r => Number(r[xField]) || 0);
  const yValues = rows.map(r => Number(r[yField]) || 0);

  spec.scales.x = {
    type: 'linear',
    domain: [Math.min(...xValues) * 0.9, Math.max(...xValues) * 1.1],
    range: [0, spec.width - spec.margin.left - spec.margin.right],
  };

  spec.scales.y = {
    type: 'linear',
    domain: [Math.min(...yValues) * 0.9, Math.max(...yValues) * 1.1],
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.axes = [
    { position: 'bottom', scale: 'x', title: xField },
    { position: 'left', scale: 'y', title: yField },
  ];

  spec.series = [{
    name: 'data',
    type: 'scatter',
    xField,
    yField,
    style: {
      radius: 6,
      opacity: 0.7,
    },
  }];
}

function convertAreaChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  const xValues = rows.map(r => String(r[xField]));
  const yValues = rows.map(r => Number(r[yField]) || 0);
  const yMax = Math.max(...yValues) * 1.1;

  spec.scales.x = {
    type: 'band',
    domain: xValues,
    range: [0, spec.width - spec.margin.left - spec.margin.right],
  };

  spec.scales.y = {
    type: 'linear',
    domain: [0, yMax],
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.axes = [
    { position: 'bottom', scale: 'x', title: xField },
    { position: 'left', scale: 'y', title: yField },
  ];

  spec.series = [{
    name: yField,
    type: 'area',
    xField,
    yField,
    curve: chart.hints?.style?.includes('平滑') ? 'monotone' : 'linear',
  }];
}

function convertRadarChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const dimField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  const dimensions = rows.map(r => String(r[dimField]));
  const values = rows.map(r => Number(r[valueField]) || 0);
  const maxValue = Math.max(...values) * 1.2;

  spec.scales.radius = {
    type: 'linear',
    domain: [0, maxValue],
    range: [0, Math.min(spec.width, spec.height) / 2 - 40],
  };

  spec.scales.angle = {
    type: 'ordinal',
    domain: dimensions,
    range: dimensions.map((_, i) => (i * 360) / dimensions.length),
  };

  spec.axes = [];
  spec.series = [{
    name: valueField,
    type: 'radar',
    xField: dimField,
    yField: valueField,
    style: {
      dimensions,
      maxValue,
    },
  }];
}

function convertComboChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';

  const xValues = rows.map(r => String(r[xField]));
  spec.scales.x = {
    type: 'band',
    domain: xValues,
    range: [0, spec.width - spec.margin.left - spec.margin.right],
  };

  // Find max values for both axes
  let leftMax = 0;
  let rightMax = 0;

  for (const s of chart.series || []) {
    const yValues = rows.map(r => Number(r[s.yField]) || 0);
    const max = Math.max(...yValues) * 1.1;
    if (s.axis === 'right') {
      rightMax = Math.max(rightMax, max);
    } else {
      leftMax = Math.max(leftMax, max);
    }
  }

  spec.scales.yLeft = {
    type: 'linear',
    domain: [0, leftMax || 100],
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.scales.yRight = {
    type: 'linear',
    domain: [0, rightMax || 100],
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.axes = [
    { position: 'bottom', scale: 'x', title: xField },
    { position: 'left', scale: 'yLeft', title: 'Left' },
    { position: 'right', scale: 'yRight', title: 'Right' },
  ];

  spec.series = (chart.series || []).map(s => ({
    name: s.name,
    type: s.type || 'line',
    xField,
    yField: s.yField,
    curve: s.type === 'line' || s.type === 'area' ? 'linear' : undefined,
  }));
}

function convertHeatmapChart(
  chart: ChartDefinition,
  spec: D3Spec,
  headers: string[],
  rows: Record<string, string | number>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  const xValues = [...new Set(rows.map(r => String(r[xField])))];
  const yValues = [...new Set(rows.map(r => String(r[yField])))];

  spec.scales.x = {
    type: 'band',
    domain: xValues,
    range: [0, spec.width - spec.margin.left - spec.margin.right],
  };

  spec.scales.y = {
    type: 'band',
    domain: yValues,
    range: [spec.height - spec.margin.top - spec.margin.bottom, 0],
  };

  spec.scales.color = {
    type: 'linear',
    domain: [0, 100],
    range: ['#f7fbff', '#08306b'],
  };

  spec.axes = [
    { position: 'bottom', scale: 'x', title: xField },
    { position: 'left', scale: 'y', title: yField },
  ];

  spec.series = [{
    name: 'heatmap',
    type: 'heatmap',
    xField,
    yField,
    style: {
      cellPadding: 2,
    },
  }];
}

function getThemeColors(themeName?: string, colorHint?: string): string[] {
  // Parse explicit color hints
  if (colorHint) {
    const hexMatches = colorHint.match(/#[0-9a-fA-F]{6}/g);
    if (hexMatches) {
      return hexMatches;
    }
  }

  // Theme-based colors
  const themes: Record<string, string[]> = {
    default: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7'],
    category10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
    category20: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'],
    tableau: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ac'],
    dark: ['#4fc3f7', '#29b6f6', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#ffee58', '#26c6da'],
  };

  return themes[themeName || 'default'] || themes.default;
}

function applyStyleHints(chart: ChartDefinition, spec: D3Spec): void {
  const style = chart.hints?.style || '';

  // Animation
  if (chart.hints?.animation) {
    if (chart.hints.animation.includes('从')) {
      spec.animation = { ...spec.animation!, duration: 1500, easing: 'ease-in-out' };
    }
  }

  // Layout adjustments
  if (style.includes('紧凑')) {
    spec.margin = { top: 20, right: 20, bottom: 40, left: 50 };
  }

  // Legend position
  if (style.includes('图例右')) {
    spec.legend = { position: 'right', orientation: 'vertical' };
    spec.margin.right = 120;
  } else if (style.includes('图例左')) {
    spec.legend = { position: 'left', orientation: 'vertical' };
    spec.margin.left = 120;
  }
}

export default render;
