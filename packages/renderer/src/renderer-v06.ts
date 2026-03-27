// ECharts Renderer for CDL v0.6
// 支持：series 表格、axis 块、interaction、国际化(i18n)、性能优化

// 临时使用 any 绕过类型检查（后续可完善）
type AnyType = any;

import { 
  t, setLocale, getLocale, formatNumber, Locale, BuiltInKeys 
} from './i18n/index';
import { 
  translateAxisName, 
  translateSeriesName, 
  translateLegendNames,
  translateTitle,
  createTooltipFormatter,
  createPieTooltipFormatter,
  applyI18nToOption 
} from './i18n/chart-i18n';
import {
  parsePerformanceHints,
  applyPerformanceOptimization,
  optimizeChartOption,
  getOptimizationSuggestions,
  ChartPerformanceHints,
} from './performance';

export interface RenderOptions {
  theme?: string;
  locale?: Locale;
  i18n?: boolean;  // 是否启用国际化（默认 true）
}

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
 * 设置渲染器的语言
 */
export function setRenderLocale(locale: Locale): void {
  setLocale(locale);
}

/**
 * 获取当前渲染器的语言
 */
export function getRenderLocale(): Locale {
  return getLocale();
}

/**
 * 主渲染函数
 */
export function render(cdlFile: any, options?: RenderOptions | string): RenderResult {
  if (cdlFile.charts.length === 0) {
    return { success: false, error: 'No chart definition found' };
  }

  const chart = cdlFile.charts[0];
  const dataMap = buildDataMap(cdlFile.data);
  
  // 处理向后兼容：options 可以是字符串（themeName）或对象
  let themeName = 'light';
  let locale: Locale | undefined;
  let enableI18n = true;
  
  if (typeof options === 'string') {
    themeName = options;
  } else if (options) {
    themeName = options.theme || 'light';
    locale = options.locale;
    enableI18n = options.i18n !== false;
  }
  
  // 设置语言
  if (locale) {
    setLocale(locale);
  }

  try {
    let option = convertChart(chart, dataMap, themeName);
    
    // 从 hints 中获取 locale 设置
    const chartLocale = chart.hints?.locale;
    if (chartLocale) {
      setLocale(chartLocale as Locale);
    }
    
    // 应用国际化
    if (enableI18n) {
      option = applyI18nToOption(option);
    }
    
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
  const dataDef = chart.data.length > 0 ? dataMap.get(chart.data[0]) : undefined;
  let { headers, rows } = dataDef ? parseData(dataDef.query) : { headers: [], rows: [] };

  // 解析性能优化配置
  const performanceHints = parsePerformanceHints(chart.hints);
  
  // 应用性能优化
  if (performanceHints.enabled !== false && rows.length > 0) {
    const xField = chart.x || headers[0] || 'x';
    const yField = chart.y || headers[1] || headers[0] || 'y';
    
    const optimizationResult = applyPerformanceOptimization(
      rows,
      performanceHints,
      xField,
      yField,
      chart.group
    );

    if (optimizationResult.isOptimized) {
      rows = optimizationResult.data;
      
      // 添加优化信息到 console（开发模式）
      if (typeof console !== 'undefined' && console.log) {
        console.log('[CDL Performance]', optimizationResult.optimizationInfo);
      }
    }
  }

  // 标题 - 支持国际化
  if (chart.hints?.title || chart.name) {
    option.title = {
      text: translateTitle(chart.hints?.title || chart.name),
      left: 'center',
      top: 10,
    };
  }

  // Tooltip 默认 - 使用国际化格式化器
  option.tooltip = {
    trigger: isPieChart(chart) ? 'item' : 'axis',
    formatter: isPieChart(chart) ? createPieTooltipFormatter() : createTooltipFormatter(),
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

  // 响应式配置
  if (chart.hints?.responsive === 'true' || chart.hints?.responsive === true) {
    // ECharts 默认响应式：不设置 width/height，使用容器尺寸
    // 调用方需要监听 resize 事件并调用 chart.resize()
    option.resize = true; // 标记需要 resize 支持
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
    case 'funnel':
      convertFunnel(chart, option, headers, rows);
      break;
    case 'treemap':
      convertTreemap(chart, option, headers, rows);
      break;
    case 'sunburst':
      convertSunburst(chart, option, headers, rows, theme);
      break;
    case 'sankey':
      convertSankey(chart, option, headers, rows);
      break;
    // New chart types
    case 'gauge':
      convertGauge(chart, option, headers, rows);
      break;
    case 'candlestick':
      convertCandlestick(chart, option, headers, rows);
      break;
    case 'boxplot':
      convertBoxplot(chart, option, headers, rows);
      break;
    case 'wordcloud':
      convertWordcloud(chart, option, headers, rows);
      break;
    case 'liquid':
      convertLiquid(chart, option, headers, rows);
      break;
    case 'map':
      convertMap(chart, option, headers, rows);
      break;
    case 'graph':
      convertGraph(chart, option, headers, rows);
      break;
    case 'parallel':
      convertParallel(chart, option, headers, rows);
      break;
    case 'tree':
      convertTree(chart, option, headers, rows);
      break;
    case 'lines':
      convertLine(chart, option, headers, rows); // alias
      break;
    case 'effectScatter':
      convertEffectScatter(chart, option, headers, rows);
      break;
    case 'dynamic':
      convertDynamic(chart, option, headers, rows);
      break;
    case 'chord':
      convertChord(chart, option, headers, rows);
      break;
    case 'calendar':
      convertCalendar(chart, option, headers, rows);
      break;
    case 'themeRiver':
      convertThemeRiver(chart, option, headers, rows);
      break;
    case 'custom':
      convertCustom(chart, option, headers, rows);
      break;
    case 'pictorialBar':
      convertPictorialBar(chart, option, headers, rows);
      break;
    case 'scatter3D':
      convertScatter3D(chart, option, headers, rows);
      break;
    case 'surface':
      convertSurface(chart, option, headers, rows);
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

  // 应用最终性能优化配置
  const finalOptimizedOption = optimizeChartOption(
    option,
    performanceHints,
    {
      dataLength: rows.length,
      xField: chart.x || headers[0] || 'x',
      yField: chart.y || headers[1] || headers[0] || 'y',
      groupBy: chart.group,
    }
  );

  return finalOptimizedOption;
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

  // v0.2+ 新增交互
  
  // Drill-down
  if (interaction.drillDown) {
    // 保存下钻配置到 option 自定义字段，前端需自行处理点击事件
    option.drillDown = {
      enabled: true,
      field: interaction.drillDown.field,
      maxLevels: interaction.drillDown.maxLevels,
      breadcrumb: interaction.drillDown.breadcrumb !== false,
    };
    // 添加点击事件处理器占位（实际需前端实现）
    option.series = option.series.map((s: any) => ({
      ...s,
      cursor: 'pointer',
    }));
  }

  // Linked highlighting
  if (interaction.link) {
    const linkConfig = Array.isArray(interaction.link) 
      ? { charts: interaction.link, group: undefined, highlight: 'both' }
      : interaction.link;
    
    option.linkHighlight = {
      enabled: true,
      charts: linkConfig.charts || [],
      group: linkConfig.group,
      highlight: linkConfig.highlight || 'both',
    };
    
    // ECharts 的 emphasis 配置会处理基础高亮
    // 多图表联动需要前端额外代码
  }

  // Live update (dynamic data)
  if (interaction.live) {
    option.live = {
      enabled: true,
      interval: interaction.live === true ? 5000 : (interaction.live === 'stream' ? 0 : interaction.live),
      stream: interaction.live === 'stream',
    };
    // 实际实时更新需要前端轮询或 WebSocket
  }

  // Animation configuration
  if (interaction.animation) {
    option.animation = {
      ...option.animation,
      easing: interaction.animation.easing || option.animation?.easing || 'cubicOut',
      duration: interaction.animation.duration || option.animation?.duration || 1000,
      delay: interaction.animation.delay || option.animation?.delay || 0,
      loop: interaction.animation.loop || option.animation?.loop || false,
    };
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

// ============================================
// 新增图表类型（v0.2+）
// ============================================

/**
 * 漏斗图转换
 * 适用于转化分析、流程流失
 */
function convertFunnel(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  // 漏斗图通常不需要 xAxis/yAxis
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 排序：默认从大到小（漏斗从上到下递减）
  const sortedRows = [...rows].sort((a, b) => {
    const valA = Number(a[valueField]) || 0;
    const valB = Number(b[valueField]) || 0;
    return valB - valA;  // 降序
  });

  option.series = [{
    name: chart.hints?.title || 'funnel',
    type: 'funnel',
    left: '10%',
    top: 60,
    bottom: 60,
    width: '80%',
    min: 0,
    max: Math.max(...sortedRows.map(r => Number(r[valueField]) || 0)),
    minSize: '0%',
    maxSize: '100%',
    sort: 'descending',
    gap: 2,
    label: {
      show: true,
      position: 'inside',
      formatter: '{c}'  // 显示数值
    },
    labelLine: {
      length: 10,
      lineStyle: {
        width: 1,
        type: 'solid'
      }
    },
    itemStyle: {
      borderColor: '#fff',
      borderWidth: 1
    },
    emphasis: {
      label: {
        fontSize: 14
      }
    },
    data: sortedRows.map(r => ({
      name: String(r[nameField] ?? ''),
      value: Number(r[valueField]) || 0
    }))
  }];

  // 如果数据有 group 字段，可以展示多漏斗对比
  if (chart.group) {
    const groups = [...new Set(rows.map(r => String(r[chart.group] ?? '')))];
    option.legend = { data: groups, top: 10 };

    // 重新排序：每个 group 独立排序
    option.series = groups.map(g => ({
      name: g,
      type: 'funnel',
      left: `${10 + groups.indexOf(g) * 25}%`,
      top: 60,
      width: '20%',
      min: 0,
      max: Math.max(...rows.filter(r => String(r[chart.group]) === g).map(r => Number(r[valueField]) || 0)),
      minSize: '0%',
      maxSize: '100%',
      gap: 2,
      label: { show: false },
      data: rows
        .filter(r => String(r[chart.group]) === g)
        .sort((a, b) => Number(b[valueField]) - Number(a[valueField]))
        .map(r => ({ name: String(r[nameField]), value: Number(r[valueField]) || 0 }))
    }));
  }
}

/**
 * 树图转换
 * 适用于层次数据、类别占比
 */
function convertTreemap(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 树图需要层级数据。目前 CDL 只支持扁平 CSV，
  // 我们通过 group 字段模拟层级：group1 -> group2 -> value
  
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';
  
  // 如果有 group，则形成两层：group -> name
  // 如果没有 group，则单层：name -> value
  
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  if (chart.group) {
    // 两层结构
    const hierarchy: Record<string, any[]> = {};
    rows.forEach(row => {
      const groupKey = String(row[chart.group] ?? '');
      if (!hierarchy[groupKey]) {
        hierarchy[groupKey] = [];
      }
      hierarchy[groupKey].push({
        name: String(row[nameField] ?? ''),
        value: Number(row[valueField]) || 0,
        itemStyle: {}
      });
    });

    const seriesData = Object.entries(hierarchy).map(([groupName, children]) => ({
      name: groupName,
      children: children
    }));

    option.series = [{
      type: 'treemap',
      visibleMin: 300,
      label: {
        show: true,
        formatter: '{b}'  // 显示名称
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2
      },
      data: seriesData
    }];
  } else {
    // 单层
    option.series = [{
      type: 'treemap',
      visibleMin: 300,
      label: {
        show: true,
        formatter: '{b}'
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2
      },
      data: rows.map(r => ({
        name: String(r[nameField] ?? ''),
        value: Number(r[valueField]) || 0
      }))
    }];
  }

  // 可选：按 value 排序
  if (chart.hints?.sort !== false) {
    option.series[0].data.sort((a: any, b: any) => b.value - a.value);
  }
}

/**
 * 旭日图转换
 * 适用于多层环形占比
 */
function convertSunburst(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[],
  theme: any  // Add theme parameter
): void {
  // 旭日图需要层级数据。类似 treemap，通过 group 字段构建层级
  
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 构建层级数据
  // 假设层级顺序：group (level1) -> name (level2) -> value
  // 也可以支持更多层级（如果有多个 group 字段）
  
  if (chart.group) {
    const hierarchy: Record<string, Record<string, number>> = {};
    rows.forEach(row => {
      const level1 = String(row[chart.group] ?? '');
      const level2 = String(row[nameField] ?? '');
      const value = Number(row[valueField]) || 0;
      
      if (!hierarchy[level1]) {
        hierarchy[level1] = {};
      }
      hierarchy[level1][level2] = (hierarchy[level1][level2] || 0) + value;
    });

    const seriesData = Object.entries(hierarchy).map(([level1, childrenObj]) => ({
      name: level1,
      itemStyle: { color: theme.primary[Object.keys(hierarchy).indexOf(level1) % theme.primary.length] },
      children: Object.entries(childrenObj).map(([level2, value]) => ({
        name: level2,
        value,
        itemStyle: { color: theme.primary[Object.keys(childrenObj).indexOf(level2) % theme.primary.length] }
      }))
    }));

    option.series = [{
      type: 'sunburst',
      data: seriesData,
      radius: [0, '90%'],
      sort: chart.hints?.sort === false ? undefined : 'desc',
      emphasis: {
        focus: 'ancestor'
      }
    }];
  } else {
    // 单层旭日图其实就是饼图，但旭日图可以有多层
    option.series = [{
      type: 'sunburst',
      data: rows.map(r => ({
        name: String(r[nameField] ?? ''),
        value: Number(r[valueField]) || 0
      })),
      radius: [0, '90%'],
      sort: 'desc',
      emphasis: {
        focus: 'ancestor'
      }
    }];
  }
}

/**
 * 桑基图转换
 * 适用于流程流向、能量/物质转移
 */
function convertSankey(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 桑基图需要 source -> target -> value 三列数据
  
  // 期望字段：
  // - x (或 source): 源节点
  // - y (或 target): 目标节点
  // - group (或 value): 流量数值
  
  const sourceField = chart.x || headers[0] || '';
  const targetField = chart.y || headers[1] || '';
  const valueField = chart.group || headers[2] || '';

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 提取节点（去重）
  const nodesSet = new Set<string>();
  rows.forEach(row => {
    nodesSet.add(String(row[sourceField] ?? ''));
    nodesSet.add(String(row[targetField] ?? ''));
  });
  const nodes = Array.from(nodesSet).map(name => ({ name }));

  // 提取连线
  const links = rows.map(row => ({
    source: String(row[sourceField] ?? ''),
    target: String(row[targetField] ?? ''),
    value: Number(row[valueField]) || 1
  }));

  // 桑基图配置
  option.series = [{
    type: 'sankey',
    layout: 'none',  // 使用 ECharts 自动布局
    emphasis: {
      focus: 'adjacency'  // 悬停时高亮相邻节点
    },
    data: nodes,
    links: links,
    top: '10%',
    bottom: '10%',
    left: '10%',
    right: '20%',
    nodeWidth: 20,
    nodeGap: 8,
    nodeAlign: 'justify',
    draggable: true,
    lineStyle: {
      color: 'gradient',
      curveness: 0.5,
      opacity: 0.4
    }
  }];

  // 如果提供了标题，显示为副标题
  if (chart.hints?.title) {
    option.title = {
      text: chart.hints.title,
      left: 'center',
      top: 10,
      subtextStyle: { fontSize: 12 }
    };
  }
}

/**
 * 仪表盘转换
 * 适用于 KPI、完成率等单指标展示
 */
function convertGauge(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 取第一行数据（通常只有一个指标）
  const firstRow = rows[0] || {};
  const value = Number(firstRow[valueField]) || 0;
  const name = String(firstRow[nameField] ?? 'KPI');

  // 计算最大值：如果没有指定，使用 value 的 1.2 倍或默认 100
  const maxValue = chart.hints?.max || Math.max(value * 1.2, 100);

  option.series = [{
    type: 'gauge',
    name: name,
    min: 0,
    max: maxValue,
    progress: { show: true },
    detail: {
      valueAnimation: true,
      formatter: '{value}',
      fontSize: 24,
      offsetCenter: [0, '70%']
    },
    data: [{ value, name }],
    axisLine: {
      lineStyle: {
        width: 30,
        color: [[0.3, '#67e0e3'], [0.7, '#37a2da'], [1, '#fd666d']]
      }
    }
  }];

  // 如果提供了标题
  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * K线图（蜡烛图）转换
 * 适用于金融数据：开盘、收盘、最低、最高
 */
function convertCandlestick(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // K线需要：date, open, close, low, high 5个字段
  // 期望字段顺序：时间, 开盘, 收盘, 最低, 最高
  const dateField = chart.x || headers[0] || '';
  const openField = headers[1] || '';
  const closeField = headers[2] || '';
  const lowField = headers[3] || '';
  const highField = headers[4] || '';

  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[dateField] ?? '')),
    name: dateField,
  }];

  option.yAxis = [{
    type: 'value',
    name: 'price',
    scale: true,  // 不从0开始，自适应
  }];

  const candlestickData = rows.map(r => [
    Number(r[openField]) || 0,
    Number(r[closeField]) || 0,
    Number(r[lowField]) || 0,
    Number(r[highField]) || 0
  ]);

  option.series = [{
    name: 'K线',
    type: 'candlestick',
    data: candlestickData,
    itemStyle: {
      color: '#ef232a',  // 上涨红
      color0: '#14b143', // 下跌绿
      borderColor: '#ef232a',
      borderColor0: '#14b143'
    }
  }];
}

/**
 * 箱线图转换
 * 适用于统计分布、异常值检测
 */
function convertBoxplot(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 箱线图数据格式：category, min, q1, median, q3, max
  const categoryField = chart.x || headers[0] || '';
  const minField = headers[1] || 'min';
  const q1Field = headers[2] || 'q1';
  const medianField = headers[3] || 'median';
  const q3Field = headers[4] || 'q3';
  const maxField = headers[5] || 'max';

  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[categoryField] ?? '')),
    name: categoryField,
  }];

  option.yAxis = [{
    type: 'value',
    name: 'value',
  }];

  // ECharts 箱线图数据格式: [min, q1, median, q3, max]
  const boxData = rows.map(r => [
    Number(r[minField]) || 0,
    Number(r[q1Field]) || 0,
    Number(r[medianField]) || 0,
    Number(r[q3Field]) || 0,
    Number(r[maxField]) || 0
  ]);

  option.series = [{
    name: 'boxplot',
    type: 'boxplot',
    data: boxData,
    tooltip: {
      formatter: (params: any) => {
        const data = params.data;
        return `
          Min: ${data[0]}<br/>
          Q1: ${data[1]}<br/>
          Median: ${data[2]}<br/>
          Q3: ${data[3]}<br/>
          Max: ${data[4]}
        `;
      }
    }
  }];
}

/**
 * 词云转换
 * 适用于关键词频率展示
 */
function convertWordcloud(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const wordField = chart.x || headers[0] || '';
  const countField = chart.y || headers[1] || headers[0] || '';

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 提取词频数据
  const wordData = rows
    .map(r => ({
      name: String(r[wordField] ?? ''),
      value: Number(r[countField]) || 0
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 200); // 限制最多200个词

  option.series = [{
    type: 'wordcloud',
    shape: chart.hints?.shape || 'circle',  // circle, card, diamond, triangle, etc.
    keepAspect: false,
    left: 'center',
    top: 'center',
    width: '90%',
    height: '90%',
    right: null,
    bottom: null,
    sizeRange: [12, 60],
    rotationRange: [-90, 90],
    rotationStep: 45,
    gridSize: 8,
    drawOutOfBound: false,
    textStyle: {
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      color: () => {
        // 随机从主题色中选择
        const colors = THEMES.light.primary;
        return colors[Math.floor(Math.random() * colors.length)];
      }
    },
    emphasis: {
      focus: 'self',
      textStyle: {
        textShadowBlur: 10,
        textShadowColor: '#333'
      }
    },
    data: wordData
  }];
}

/**
 * 水波图转换
 * 适用于进度、完成率展示
 */
function convertLiquid(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const nameField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 取前几行作为多个水波图（通常是1个）
  const liquidData = rows.slice(0, 3).map(r => ({
    name: String(r[nameField] ?? ''),
    value: Number(r[valueField]) || 0
  }));

  // 水波图 series，每个数据一个系列
  option.series = liquidData.map((item, index) => ({
    type: 'liquidFill',
    name: item.name,
    radius: `${60 - index * 15}%`,  // 多个时内缩
    center: [`${50 + (index - liquidData.length/2 + 0.5) * 20}%`, '50%'],
    data: [item.value / 100],  // ECharts 期望 0-1
    backgroundStyle: {
      color: 'rgba(255, 255, 255, 0.1)'
    },
    outline: {
      show: false
    },
    label: {
      show: true,
      fontSize: 24,
      formatter: (param: any) => `${(param.value * 100).toFixed(0)}%`
    }
  }));

  // 如果有标题
  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 地图转换（简化版）
 * 注意：需要预先注册地图 JSON，这里只展示数据绑定
 */
function convertMap(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 地图需要注册地图数据。这里假设 map 已注册（如 'china', 'world' 等）
  // 数据格式：region, value
  
  const regionField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 提取地图数据
  const mapData = rows.map(r => ({
    name: String(r[regionField] ?? ''),
    value: Number(r[valueField]) || 0
  }));

  // 期望 chart.mapName 指定地图名称
  const mapName = chart.mapName || 'china';

  option.series = [{
    type: 'map',
    map: mapName,
    data: mapData,
    label: {
      show: true,
      fontSize: 10
    },
    emphasis: {
      label: { show: true },
      itemStyle: {
        areaColor: '#ffd700'
      }
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 关系图（网络图）转换
 * 适用于节点关系、网络拓扑
 */
function convertGraph(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 关系图需要 source, target, weight 三列
  // 或者通过 series 表格配置
  
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 提取节点（从 source 和 target 收集）
  const nodeSet = new Set<string>();
  const links = rows.map(row => ({
    source: String(row.source || row.from || row.s || ''),
    target: String(row.target || row.to || row.t || ''),
    value: Number(row.weight || row.value || row.w || 1)
  }));

  links.forEach(link => {
    nodeSet.add(link.source);
    nodeSet.add(link.target);
  });

  const nodes = Array.from(nodeSet).map(name => ({ name, symbolSize: 20 }));

  // 力引导布局
  option.series = [{
    type: 'graph',
    layout: 'force',
    data: nodes,
    links: links,
    categories: chart.group ? [{ name: 'default' }] : undefined,
    roam: true,  // 允许缩放和平移
    label: {
      show: true,
      position: 'right',
      fontSize: 12
    },
    force: {
      repulsion: 100,
      edgeLength: 50
    },
    lineStyle: {
      color: 'source',
      curveness: 0.3
    },
    emphasis: {
      focus: 'adjacency',
      lineStyle: {
        width: 4
      }
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 平行坐标图转换
 * 适用于多维数据对比
 */
function convertParallel(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 平行坐标：每行是一个维度，每列是一个数据项
  // 但通常数据格式：data1, data2, ... 每个字段是一个维度
  
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // dimensions: 每个维度的名称和类型
  const dims = headers.map((h, idx) => ({
    name: h,
    type: 'value'  // 假设都是数值，也可以从数据推断
  }));

  const parallelData = rows.map(row => {
    const values: any[] = [];
    headers.forEach(h => {
      const v = row[h];
      values.push(v === undefined ? null : Number(v) || 0);
    });
    return values;
  });

  option.series = [{
    name: 'parallel',
    type: 'parallel',
    smooth: true,
    lineStyle: {
      width: 2,
      opacity: 0.6
    },
    data: parallelData
  }];

  option.parallel = {
    left: '10%',
    right: '20%',
    bottom: '10%',
    top: '15%',
    parallelAxis: dims.map(dim => ({
      dim: dim.name,
      name: dim.name,
      type: dim.type
    }))
  };

  // 图例（如果有 group）
  if (chart.group) {
    const groups = [...new Set(rows.map(r => String(r[chart.group] ?? '')))];
    option.legend = { data: groups };
    // 需要根据 group 给 data 添加分类标识，这里简化处理
  }

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 树图转换
 */
function convertTree(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  const parentField = headers[0] || 'parent';
  const childField = headers[1] || 'child';
  const valueField = headers[2] || 'value';

  const nodeMap = new Map<string, any>();
  const roots: any[] = [];

  rows.forEach(row => {
    const child = String(row[childField] ?? '');
    if (child && !nodeMap.has(child)) {
      nodeMap.set(child, { name: child, value: Number(row[valueField]) || 0, children: [] });
    }
  });

  rows.forEach(row => {
    const parent = String(row[parentField] ?? '');
    const child = String(row[childField] ?? '');
    if (parent && nodeMap.has(parent)) {
      const parentNode = nodeMap.get(parent);
      const childNode = nodeMap.get(child);
      if (childNode && !parentNode.children.includes(childNode)) {
        parentNode.children.push(childNode);
      }
    } else {
      const childNode = nodeMap.get(child);
      if (childNode && !roots.includes(childNode)) {
        roots.push(childNode);
      }
    }
  });

  if (roots.length === 0) {
    nodeMap.forEach(node => roots.push(node));
  }

  option.series = [{
    type: 'tree',
    data: roots,
    top: '10%', left: '10%', bottom: '10%', right: '20%',
    symbol: 'emptyCircle', symbolSize: 7,
    initialTreeDepth: 2, layout: 'orthogonal', orientation: 'LR',
    label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: 12 },
    leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
    expandAndCollapse: true,
    animationDuration: 550, animationDurationUpdate: 750
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 动态折线图（Flame/Stream）
 */
function convertDynamic(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const timeField = chart.x || headers[0] || '';
  const categoryField = headers[1] || 'category';
  const valueField = headers[2] || headers[1] || 'value';

  option.xAxis = [{
    type: 'category',
    data: [...new Set(rows.map(r => String(r[timeField] ?? '')))],
    name: timeField,
  }];

  const categories = [...new Set(rows.map(r => String(r[categoryField] ?? '')))];

  option.yAxis = [{ type: 'value', name: valueField }];

  const series = categories.map(cat => {
    const data = rows
      .filter(r => String(r[categoryField] ?? '') === cat)
      .sort((a, b) => String(a[timeField] ?? '').localeCompare(String(b[timeField] ?? '')))
      .map(r => Number(r[valueField]) || 0);
    
    return { name: cat, type: 'line', data, smooth: true, stack: chart.stack ? 'total' : undefined, areaStyle: chart.type === 'area' ? {} : undefined };
  });

  option.series = series;
}

/**
 * 带涟漪特效的散点图
 */
function convertEffectScatter(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  convertScatter(chart, option, headers, rows);
  
  option.series = option.series.map((s: any) => ({
    ...s,
    type: 'effectScatter',
    rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
    itemStyle: { color: s.itemStyle?.color || '#5470c6', shadowBlur: 10, shadowColor: '#333' }
  }));
}

/**
 * 带特效的折线图（动态阴影/发光）
 */
function convertDynamicLine(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  convertLine(chart, option, headers, rows);
  
  option.series = option.series.map((s: any) => ({
    ...s,
    type: 'line',
    showSymbol: false,
    lineStyle: { width: 3, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetY: 5 },
    areaStyle: s.areaStyle ? { opacity: 0.3 } : undefined
  }));
}

/**
 * 辅助：获取字段值
 */
function getFieldValue(row: Record<string, any>, field: string, fallback?: any): any {
  if (field && row.hasOwnProperty(field)) {
    return row[field];
  }
  return fallback;
}

export { getFieldValue };

/**
 * 弦图转换
 * 适用于实体间关系流动（如迁移、贸易）
 */
function convertChord(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 弦图数据格式：source, target, value
  const links = rows.map(row => ({
    source: String(row.source || row.from || ''),
    target: String(row.target || row.to || ''),
    value: Number(row.value || row.weight || 0)
  }));

  // 提取节点
  const nodeSet = new Set<string>();
  links.forEach(link => {
    nodeSet.add(link.source);
    nodeSet.add(link.target);
  });
  const nodes = Array.from(nodeSet).map(name => ({ name }));

  // 构建邻接矩阵
  const matrix: number[][] = [];
  for (let i = 0; i < nodes.length; i++) {
    matrix[i] = new Array(nodes.length).fill(0);
  }

  const nodeIndex = new Map(nodes.map((n, i) => [n.name, i]));
  links.forEach(link => {
    const i = nodeIndex.get(link.source);
    const j = nodeIndex.get(link.target);
    if (i !== undefined && j !== undefined) {
      matrix[i][j] = link.value;
    }
  });

  option.series = [{
    type: 'chord',
    radius: '65%',
    center: ['50%', '50%'],
    data: nodes,
    links: links,
    lineStyle: {
      curveness: 0.5,
      opacity: 0.5
    },
    itemStyle: {
      borderRadius: 5,
      borderColor: '#fff',
      borderWidth: 1
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 日历图转换
 * 适用于日期数据的热度展示
 */
function convertCalendar(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  delete option.xAxis;
  delete option.yAxis;
  delete option.grid;

  // 期望字段：date, value
  const dateField = chart.x || headers[0] || 'date';
  const valueField = chart.y || headers[1] || headers[0] || 'value';

  const calendarData = rows.map(row => ({
    name: String(row[dateField] ?? ''),
    value: Number(row[valueField]) || 0,
    startDate: new Date(String(row[dateField] ?? '')),
  }));

  // 计算日期范围
  const years = [...new Set(calendarData.map(d => d.startDate.getFullYear()))];
  const startYear = Math.min(...years);
  const endYear = Math.max(...years);

  option.calendar = {
    top: 'middle',
    left: 'center',
    orient: 'vertical',
    cellSize: ['auto', 13],
    yearLabel: { show: true, position: 'top' },
    monthLabel: { show: true, nameMap: 'cn', fontSize: 12 },
    dayLabel: { show: true, nameMap: 'cn', fontSize: 12 },
    splitLine: { show: true, lineStyle: { color: '#ccc', width: 2, type: 'dashed' } },
    itemStyle: { borderWidth: 2, borderColor: '#fff' },
    range: [startYear, endYear]
  };

  option.tooltip = {
    formatter: (params: any) => {
      const date = params.value[0];
      const value = params.value[1];
      return `${date}: ${value}`;
    }
  };

  option.series = [{
    type: 'calendar',
    coordinateSystem: 'calendar',
    data: calendarData.map(d => [d.name, d.value]),
    itemStyle: {
      color: '#d94e5d',
      borderWidth: 2,
      borderColor: '#fff'
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 河流图转换
 * 适用于分类数据随时间的变化趋势
 */
function convertThemeRiver(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 河流图数据格式：date, value, category
  const dateField = chart.x || headers[0] || 'date';
  const valueField = headers[1] || 'value';
  const categoryField = headers[2] || 'category';

  // 提取时间点
  const dates = [...new Set(rows.map(r => String(r[dateField] ?? '')))].sort();

  // 提取分类
  const categories = [...new Set(rows.map(r => String(r[categoryField] ?? '')))];

  // 构建河流数据
  const seriesData = categories.map(cat => {
    const data = dates.map(date => {
      const match = rows.find(r => String(r[dateField]) === date && String(r[categoryField]) === cat);
      return match ? Number(match[valueField]) || 0 : 0;
    });
    return {
      name: cat,
      type: 'themeRiver',
      data: data.map((value, idx) => [dates[idx], value])
    };
  });

  option.xAxis = [{
    type: 'category',
    data: dates,
    axisLine: { show: false },
    axisTick: { show: false }
  }];

  option.yAxis = [{ type: 'value', show: false }];

  option.series = seriesData;

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 自定义图表（占位）
 * 允许用户通过 JS 函数自定义渲染逻辑
 */
function convertCustom(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 如果用户提供了自定义渲染函数
  if (chart.customRenderer && typeof chart.customRenderer === 'function') {
    try {
      chart.customRenderer(chart, option, headers, rows);
    } catch (e) {
      console.error('Custom renderer error:', e);
      option.series = [{
        type: 'line',
        data: rows.map(r => Number(r[headers[0]]) || 0)
      }];
    }
  } else {
    // 回退到折线图
    convertLine(chart, option, headers, rows);
  }
}

/**
 * 象形柱图转换
 * 适用于用图标/图片作为柱子的图表
 */
function convertPictorialBar(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  const categoryField = chart.x || headers[0] || '';
  const valueField = chart.y || headers[1] || headers[0] || '';

  option.xAxis = [{
    type: 'category',
    data: rows.map(r => String(r[categoryField] ?? '')),
    name: categoryField,
  }];

  option.yAxis = [{ type: 'value', name: valueField }];

  // 符号可以是路径或表情符号
  const symbol = chart.hints?.symbol || 'circle';

  option.series = [{
    type: 'pictorialBar',
    symbol,
    symbolSize: ['50%', '100%'],
    symbolRepeat: true,
    symbolMargin: '10%',
    data: rows.map(r => Number(r[valueField]) || 0),
    itemStyle: {
      color: '#5470c6',
      borderColor: '#fff',
      borderWidth: 1
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 3D 散点图转换
 * 适用于三维数据点分布
 */
function convertScatter3D(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 需要 x, y, z 三个字段
  const xField = chart.x || headers[0] || 'x';
  const yField = headers[1] || 'y';
  const zField = headers[2] || headers[1] || 'z';

  option.xAxis3D = { type: 'value', name: xField };
  option.yAxis3D = { type: 'value', name: yField };
  option.zAxis3D = { type: 'value', name: zField };

  option.grid3D = {
    boxWidth: 200,
    boxDepth: 80,
    viewControl: {
      projection: 'perspective',
      autoRotate: chart.hints?.autoRotate || false
    },
    light: {
      main: { intensity: 1.2, shadow: true },
      ambient: { intensity: 0.3 }
    }
  };

  const data = rows.map(r => [
    Number(r[xField]) || 0,
    Number(r[yField]) || 0,
    Number(r[zField]) || 0
  ]);

  option.series = [{
    type: 'scatter3D',
    data,
    symbolSize: 10,
    itemStyle: {
      color: '#5470c6',
      opacity: 0.8
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}

/**
 * 3D 曲面图转换
 * 适用于地形、函数曲面等三维数据
 */
function convertSurface(
  chart: any,
  option: any,
  headers: string[],
  rows: Record<string, any>[]
): void {
  // 曲面图需要 X 和 Y 网格数据，以及 Z 值
  // 简化：假设数据已经是以网格形式组织的
  
  option.xAxis3D = { type: 'value', name: 'X' };
  option.yAxis3D = { type: 'value', name: 'Y' };
  option.zAxis3D = { type: 'value', name: 'Z' };

  option.grid3D = {
    boxWidth: 200,
    boxDepth: 200,
    viewControl: {
      projection: 'perspective',
      autoRotate: chart.hints?.autoRotate || false
    },
    light: {
      main: { intensity: 1.2, shadow: true },
      ambient: { intensity: 0.3 }
    }
  };

  // 将数据转换为 ECharts 3D 曲面格式
  // 假设数据点按顺序排列，可以推断网格
  const data = rows.map(r => {
    const x = Number(r[headers[0]]) || 0;
    const y = Number(r[headers[1]]) || 0;
    const z = Number(r[headers[2]]) || 0;
    return [x, y, z];
  });

  option.series = [{
    type: 'surface',
    data: data,
    shading: 'color', // 'color', 'lambert', 'realistic'
    wireframe: { show: false },
    itemStyle: {
      color: '#5470c6',
      opacity: 0.9
    }
  }];

  if (chart.hints?.title) {
    option.title = { text: chart.hints.title, left: 'center', top: 10 };
  }
}
