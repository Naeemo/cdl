// ECharts Renderer for CDL v0.6
// 支持：series 表格、axis 块、interaction

// 临时使用 any 绕过类型检查（后续可完善）
type AnyType = any;

export interface RenderResult {
  success: boolean;
  option?: any;
  error?: string;
}

// 默认主题
const THEMES: Record<string, { primary: string[]; background?: string; text?: string }> = {
  light: {
    primary: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
    background: '#ffffff',
    text: '#333333',
  },
  dark: {
    primary: ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3'],
    background: '#1a1a2e',
    text: '#e0e0e0',
  },
};

/**
 * 主渲染函数
 */
export function render(cdlFile: any, themeName?: string): RenderResult {
  if (cdlFile.charts.length === 0) {
    return { success: false, error: 'No chart definition found' };
  }

  const chart = cdlFile.charts[0];
  const dataMap = buildDataMap(cdlFile.data);
  const effectiveTheme = themeName || 'light';

  try {
    const option = convertChart(chart, dataMap, effectiveTheme);
    return { success: true, option };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

function buildDataMap(dataDefs: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const data of dataDefs) {
    map.set(data.name, data);
  }
  return map;
}

/**
 * 核心转换逻辑
 */
function convertChart(
  chart: any,
  dataMap: Map<string, any>,
  themeName: string
): any {
  const theme = THEMES[themeName] || THEMES.light;

  const option: any = {
    animation: true,
    animationDuration: 1000,
    backgroundColor: theme.background,
    textStyle: { color: theme.text },
    color: theme.primary,
  };

  // 获取数据
  const dataDef = chart.dataSources.length > 0 ? dataMap.get(chart.dataSources[0]) : undefined;
  const { headers, rows } = dataDef ? parseData(dataDef.query) : { headers: [], rows: [] };

  // 标题
  if (chart.hints?.title || chart.name) {
    option.title = {
      text: chart.hints?.title || chart.name,
      left: 'center',
      top: 10,
    };
  }

  // Tooltip 默认
  option.tooltip = {
    trigger: isPieChart(chart) ? 'item' : 'axis',
  };

  // Grid（非饼图/雷达图）
  if (!isPieChart(chart) && chart.chartType !== 'radar') {
    option.grid = {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    };
  }

  // 自定义颜色
  if (chart.hints?.color) {
    option.color = parseColors(chart.hints.color);
  }

  // 根据图表类型转换
  switch (chart.chartType) {
    case 'line':
      convertLine(chart, option, headers, rows);
      break;
    case 'bar':
      convertBar(chart, option, headers, rows);
      break;
    case 'pie':
      convertPie(chart, option, headers, rows);
      break;
    case 'scatter':
      convertScatter(chart, option, headers, rows);
      break;
    case 'area':
      convertArea(chart, option, headers, rows);
      break;
    case 'radar':
      convertRadar(chart, option, headers, rows);
      break;
    case 'combo':
      convertCombo(chart, option, headers, rows);
      break;
    case 'heatmap':
      convertHeatmap(chart, option, headers, rows);
      break;
    default:
      convertLine(chart, option, headers, rows);
  }

  // 应用交互配置
  if (chart.interaction) {
    applyInteraction(chart.interaction, option);
  }

  // 应用样式提示
  applyStyleHints(chart, option);

  return option;
}

function isPieChart(chart: any): boolean {
  return chart.chartType === 'pie' || chart.chartType === 'liquid';
}

/**
 * 解析内联 CSV 数据
 */
function parseData(query: string): { headers: string[]; rows: Record<string, any>[] } {
  const lines = query.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, any> = {};
    headers.forEach((h, i) => {
      const val = values[i] ?? '';
      const num = Number(val);
      row[h] = isNaN(num) ? val : num;
    });
    return row;
  });

  return { headers, rows };
}

/**
 * 折线图转换
 */
function convertLine(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[xField] ?? '')),
    name: xField,
  }];

  option.yAxis = [{
    type: 'value',
    name: yField,
  }];

  if (chart.group) {
    const groups = [...new Set(rows.map(r => String(r[chart.group] ?? '')))];
    option.legend = { data: groups };

    option.series = groups.map(g => ({
      name: g,
      type: 'line',
      data: rows.filter(r => String(r[chart.group]) === g).map(r => Number(r[yField]) || 0),
      smooth: chart.hints?.style?.toLowerCase().includes('smooth'),
    }));
  } else {
    option.series = [{
      name: yField,
      type: 'line',
      data: rows.map(r => Number(r[yField]) || 0),
      smooth: chart.hints?.style?.toLowerCase().includes('smooth'),
      symbol: chart.hints?.style?.toLowerCase().includes('marker') ? 'circle' : 'none',
    }];
  }
}

/**
 * 柱状图转换
 */
function convertBar(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[xField] ?? '')),
    name: xField,
  }];

  option.yAxis = [{
    type: 'value',
    name: yField,
  }];

  if (chart.group) {
    const groups = [...new Set(rows.map(r => String(r[chart.group] ?? '')))];
    option.legend = { data: groups };

    const stackValue = chart.stack === true ? 'total' : (chart.stack || undefined);
    option.series = groups.map(g => ({
      name: g,
      type: 'bar',
      data: rows.filter(r => String(r[chart.group]) === g).map(r => Number(r[yField]) || 0),
      stack: stackValue,
    }));
  } else {
    option.series = [{
      name: yField,
      type: 'bar',
      data: rows.map(r => Number(r[yField]) || 0),
      stack: chart.stack === true ? 'total' : chart.stack || undefined,
    }];
  }
}

/**
 * 饼图转换
 */
function convertPie(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  const isDonut = chart.hints?.style?.toLowerCase().includes('donut') ||
                  chart.hints?.style?.toLowerCase().includes('环形');

  option.series = [{
    name: chart.hints?.title || 'data',
    type: 'pie',
    radius: isDonut ? ['40%', '70%'] : '60%',
    data: rows.map(r => ({
      name: String(r[nameField] ?? ''),
      value: Number(r[valueField]) || 0,
    })),
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.5)',
      },
    },
  }];

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;
}

/**
 * 散点图转换
 */
function convertScatter(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = [{
    type: 'value',
    name: xField,
  }];

  option.yAxis = [{
    type: 'value',
    name: yField,
  }];

  option.series = [{
    name: 'data',
    type: 'scatter',
    data: rows.map(r => [Number(r[xField]) || 0, Number(r[yField]) || 0]),
    symbolSize: 10,
  }];
}

/**
 * 面积图转换
 */
function convertArea(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const xField = chart.x || headers[0] || '';
  const yField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[xField] ?? '')),
    name: xField,
  }];

  option.yAxis = [{
    type: 'value',
    name: yField,
  }];

  option.series = [{
    name: yField,
    type: 'line',
    data: rows.map(r => Number(r[yField]) || 0),
    areaStyle: {},
    smooth: chart.hints?.style?.toLowerCase().includes('smooth'),
    stack: chart.stack === true ? 'total' : chart.stack || undefined,
  }];
}

/**
 * 雷达图转换
 */
function convertRadar(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const dimField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  const maxValue = Math.max(...rows.map(r => Number(r[valueField]) || 0)) * 1.2;

  option.radar = {
    indicator: rows.map(r => ({
      name: String(r[dimField] ?? ''),
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

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;
}

/**
 * 组合图转换（v0.6 核心：支持 series 配置）
 */
function convertCombo(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const xField = chart.x || headers[0] || '';

  // X 轴
  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[xField] ?? '')),
  }];

  // 决定 Y 轴数量
  const needsRightAxis = chart.series?.some((s: any) => s.axis === 'right');
  option.yAxis = [
    { type: 'value', name: 'left', position: 'left' },
    ...(needsRightAxis ? [{ type: 'value', name: 'right', position: 'right' }] : [])
  ];

  // 构建 series
  if (chart.series && chart.series.length > 0) {
    option.series = chart.series.map((s: any) => ({
      name: s.as || s.field,
      type: s.type || 'line',
      xAxisIndex: 0,
      yAxisIndex: s.axis === 'right' ? 1 : 0,
      data: rows.map(r => Number(r[s.field]) || 0),
      smooth: s.style?.toLowerCase().includes('smooth'),
    }));
  } else {
    // 回退逻辑（旧语法）
    if (headers.length >= 2) {
      option.series = [{
        name: headers[1],
        type: 'bar',
        yAxisIndex: 0,
        data: rows.map(r => Number(r[headers[1]]) || 0),
      }];
      if (headers.length >= 3) {
        option.series.push({
          name: headers[2],
          type: 'line',
          yAxisIndex: 1,
          data: rows.map(r => Number(r[headers[2]]) || 0),
        });
      }
    }
  }
}

/**
 * 热力图转换（简化版）
 */
function convertHeatmap(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  if (headers.length >= 3) {
    const xField = headers[0];
    const yField = headers[1];
    const valueField = headers[2];

    const xValues = [...new Set(rows.map(r => String(r[xField] ?? '')))];
    const yValues = [...new Set(rows.map(r => String(r[yField] ?? '')))];

    option.xAxis = [{ type: 'category', data: xValues }];
    option.yAxis = [{ type: 'category', data: yValues }];
    option.visualMap = {
      min: 0,
      max: Math.max(...rows.map(r => Number(r[valueField]) || 0)),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
    };
    option.series = [{
      name: valueField,
      type: 'heatmap',
      data: rows.map(r => [String(r[xField]), String(r[yField]), Number(r[valueField]) || 0]),
      label: { show: true },
    }];
  }
}

/**
 * 应用交互配置
 */
function applyInteraction(
  interaction: any,
  option: any
): void {
  // Tooltip
  if (interaction.tooltip) {
    option.tooltip = {
      ...option.tooltip,
      trigger: interaction.tooltip === 'none' ? 'none' : (interaction.tooltip === 'shared' ? 'axis' : 'item'),
    };
  }

  // Zoom
  if (interaction.zoom) {
    option.dataZoom = [];
    if (interaction.zoom === true || interaction.zoom === 'inside') {
      option.dataZoom.push({
        type: 'inside',
        xAxisIndex: 0,
        yAxisIndex: 0,
      });
    }
    if (interaction.zoom === 'slider') {
      option.dataZoom.push({
        type: 'slider',
        xAxisIndex: 0,
        yAxisIndex: 0,
        bottom: 10,
      });
    }
  }

  // Brush
  if (interaction.brush) {
    option.brush = {
      toolbox: ['rect', 'polygon', 'clear'],
      xAxisIndex: 0,
      yAxisIndex: 0,
    };
    if (typeof interaction.brush === 'object' && interaction.brush.connect) {
      option.brush.link = interaction.brush.connect;
    }
  }
}

/**
 * 应用样式提示
 */
function applyStyleHints(chart: any, option: any): void {
  // Grid 显示控制
  if (chart.hints?.grid === false) {
    if (Array.isArray(option.xAxis)) {
      option.xAxis = option.xAxis.map((ax: any) => ({ ...ax, splitLine: { show: false } }));
    } else if (option.xAxis) {
      option.xAxis = { ...option.xAxis, splitLine: { show: false } };
    }
    if (Array.isArray(option.yAxis)) {
      option.yAxis = option.yAxis.map((ay: any) => ({ ...ay, splitLine: { show: false } }));
    } else if (option.yAxis) {
      option.yAxis = { ...option.yAxis, splitLine: { show: false } };
    }
  }

  // Theme 支持
  if (chart.hints?.theme) {
    const themeData = THEMES[chart.hints.theme as keyof typeof THEMES];
    if (themeData) {
      option.backgroundColor = themeData.background;
      option.textStyle = { color: themeData.text };
    }
  }
}

/**
 * 解析颜色字符串
 */
function parseColors(colorStr: string): string[] {
  const hexMatches = colorStr.match(/#[0-9a-fA-F]{6}/g);
  if (hexMatches && hexMatches.length > 0) {
    return hexMatches;
  }
  return THEMES.light.primary;
}