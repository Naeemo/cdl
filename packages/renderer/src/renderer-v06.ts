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
