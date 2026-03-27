/**
 * Chart i18n Helpers - 图表国际化辅助函数
 * 处理图表标签、提示框、图例的多语言支持
 */

import { t, formatNumber, formatDate, Locale, BuiltInKeys } from './index';

// 图表类型到翻译键的映射
const chartTypeKeyMap: Record<string, string> = {
  line: BuiltInKeys.CHART_LINE,
  bar: BuiltInKeys.CHART_BAR,
  pie: BuiltInKeys.CHART_PIE,
  scatter: BuiltInKeys.CHART_SCATTER,
  area: BuiltInKeys.CHART_AREA,
  radar: BuiltInKeys.CHART_RADAR,
  funnel: BuiltInKeys.CHART_FUNNEL,
  treemap: BuiltInKeys.CHART_TREEMAP,
  sunburst: BuiltInKeys.CHART_SUNBURST,
  sankey: BuiltInKeys.CHART_SANKEY,
  gauge: BuiltInKeys.CHART_GAUGE,
  candlestick: BuiltInKeys.CHART_CANDLESTICK,
  boxplot: BuiltInKeys.CHART_BOXPLOT,
  heatmap: BuiltInKeys.CHART_HEATMAP,
  map: BuiltInKeys.CHART_MAP,
  graph: BuiltInKeys.CHART_GRAPH,
  wordcloud: 'chart.wordcloud',
  liquid: 'chart.liquid',
};

/**
 * 获取图表类型的本地化名称
 */
export function getChartTypeName(chartType: string): string {
  const key = chartTypeKeyMap[chartType];
  if (key) {
    return t(key, chartType);
  }
  return t(`chart.${chartType}`, chartType);
}

/**
 * 翻译坐标轴名称
 * 如果名称是一个翻译键，则进行翻译，否则原样返回
 */
export function translateAxisName(name: string): string {
  if (!name) return '';
  
  // 检查是否是内置的轴标签
  const axisKeys: Record<string, string> = {
    'x': 'axis.x',
    'y': 'axis.y',
    'category': 'axis.category',
    'value': 'axis.value',
    'time': 'axis.time',
  };
  
  if (axisKeys[name.toLowerCase()]) {
    return t(axisKeys[name.toLowerCase()], name);
  }
  
  // 尝试作为翻译键翻译
  return t(name, name);
}

/**
 * 翻译系列名称
 */
export function translateSeriesName(name: string): string {
  if (!name) return t('label.value', 'Value');
  return t(name, name);
}

/**
 * 翻译图例名称数组
 */
export function translateLegendNames(names: string[]): string[] {
  return names.map(name => translateSeriesName(name));
}

/**
 * 翻译标题
 */
export function translateTitle(title: string): string {
  if (!title) return '';
  return t(title, title);
}

/**
 * 生成带翻译的提示框格式化器
 * 支持数值格式化和自定义模板
 */
export function createTooltipFormatter(options?: {
  valueFormatter?: (value: number) => string;
  nameFormatter?: (name: string) => string;
  template?: string;
}): (params: any) => string {
  const {
    valueFormatter = (v: number) => formatNumber(v),
    nameFormatter = (n: string) => translateSeriesName(n),
    template,
  } = options || {};
  
  return (params: any): string => {
    // 处理数组参数（多系列）
    if (Array.isArray(params)) {
      if (params.length === 0) {
        return t(BuiltInKeys.TOOLTIP_NO_DATA, 'No Data');
      }
      
      const firstParam = params[0];
      const axisValue = firstParam.axisValue || firstParam.name || '';
      
      let html = `<div class="cdl-tooltip">`;
      html += `<div class="cdl-tooltip-title">${axisValue}</div>`;
      html += `<div class="cdl-tooltip-items">`;
      
      params.forEach(param => {
        const name = nameFormatter(param.seriesName || param.name || '');
        const value = typeof param.value === 'number' 
          ? valueFormatter(param.value)
          : param.value;
        const marker = param.marker || '';
        
        html += `<div class="cdl-tooltip-item">${marker} <span>${name}:</span> <strong>${value}</strong></div>`;
      });
      
      html += `</div></div>`;
      return html;
    }
    
    // 单系列
    const name = nameFormatter(params.seriesName || params.name || '');
    let value: any = params.value;
    
    // 处理数组值（如散点图 [x, y]）
    if (Array.isArray(value)) {
      value = value.map((v, i) => {
        if (typeof v === 'number') {
          return valueFormatter(v);
        }
        return v;
      }).join(', ');
    } else if (typeof value === 'number') {
      value = valueFormatter(value);
    } else if (typeof value === 'object' && value !== null) {
      // 对象类型（如饼图数据）
      value = valueFormatter(value.value) || value.value;
    }
    
    const marker = params.marker || '';
    
    // 使用自定义模板或默认模板
    if (template) {
      return template
        .replace('{name}', name)
        .replace('{value}', String(value))
        .replace('{marker}', marker);
    }
    
    return `${marker} ${name}: <strong>${value}</strong>`;
  };
}

/**
 * 创建饼图/环形图的提示框格式化器
 */
export function createPieTooltipFormatter(options?: {
  showPercent?: boolean;
  valueFormatter?: (value: number) => string;
}): (params: any) => string {
  const {
    showPercent = true,
    valueFormatter = (v: number) => formatNumber(v),
  } = options || {};
  
  return (params: any): string => {
    const name = translateSeriesName(params.name || '');
    const value = typeof params.value === 'object' 
      ? params.value.value 
      : params.value;
    const percent = params.percent;
    
    let result = `<div class="cdl-tooltip">`;
    result += `<div class="cdl-tooltip-title">${name}</div>`;
    result += `<div class="cdl-tooltip-value">${t('label.value', 'Value')}: <strong>${valueFormatter(Number(value))}</strong></div>`;
    
    if (showPercent && percent !== undefined) {
      result += `<div class="cdl-tooltip-percent">${t('label.percent', 'Percentage')}: <strong>${percent}%</strong></div>`;
    }
    
    result += `</div>`;
    return result;
  };
}

/**
 * 创建 KPI/仪表盘的数据格式化器
 */
export function createGaugeFormatter(options?: {
  suffix?: string;
  decimals?: number;
}): (value: number) => string {
  const { suffix = '', decimals = 0 } = options || {};
  
  return (value: number): string => {
    const formatted = decimals > 0 
      ? value.toFixed(decimals) 
      : formatNumber(value);
    return `${formatted}${suffix}`;
  };
}

/**
 * 翻译数据聚合函数名称
 */
export function translateAggregation(name: string): string {
  const aggKeys: Record<string, string> = {
    'sum': 'agg.sum',
    'avg': 'agg.avg',
    'average': 'agg.avg',
    'count': 'agg.count',
    'max': 'agg.max',
    'min': 'agg.min',
    'median': 'agg.median',
    'first': 'agg.first',
    'last': 'agg.last',
  };
  
  const key = aggKeys[name.toLowerCase()];
  if (key) {
    return t(key, name);
  }
  
  return t(name, name);
}

/**
 * 应用 i18n 到 ECharts 配置
 * 自动翻译标题、轴标签、图例、提示框等
 */
export function applyI18nToOption(option: any, locale?: Locale): any {
  const result = { ...option };
  
  // 翻译标题
  if (result.title) {
    if (typeof result.title === 'string') {
      result.title = translateTitle(result.title);
    } else if (result.title.text) {
      result.title.text = translateTitle(result.title.text);
    } else if (Array.isArray(result.title)) {
      result.title = result.title.map((t: any) => ({
        ...t,
        text: t.text ? translateTitle(t.text) : t.text,
      }));
    }
  }
  
  // 翻译 X 轴名称
  if (result.xAxis) {
    const axes = Array.isArray(result.xAxis) ? result.xAxis : [result.xAxis];
    result.xAxis = axes.map((axis: any) => ({
      ...axis,
      name: axis.name ? translateAxisName(axis.name) : axis.name,
    }));
  }
  
  // 翻译 Y 轴名称
  if (result.yAxis) {
    const axes = Array.isArray(result.yAxis) ? result.yAxis : [result.yAxis];
    result.yAxis = axes.map((axis: any) => ({
      ...axis,
      name: axis.name ? translateAxisName(axis.name) : axis.name,
    }));
  }
  
  // 翻译系列名称
  if (result.series) {
    result.series = result.series.map((s: any) => ({
      ...s,
      name: s.name ? translateSeriesName(s.name) : s.name,
    }));
  }
  
  // 翻译图例数据
  if (result.legend?.data) {
    result.legend.data = translateLegendNames(result.legend.data);
  }
  
  // 设置提示框格式化器（如果尚未设置）
  if (!result.tooltip?.formatter) {
    const isPie = result.series?.some((s: any) => s.type === 'pie');
    result.tooltip = {
      ...result.tooltip,
      formatter: isPie 
        ? createPieTooltipFormatter() 
        : createTooltipFormatter(),
    };
  }
  
  return result;
}

// 导出所有辅助函数
export const ChartI18n = {
  getChartTypeName,
  translateAxisName,
  translateSeriesName,
  translateLegendNames,
  translateTitle,
  translateAggregation,
  createTooltipFormatter,
  createPieTooltipFormatter,
  createGaugeFormatter,
  applyI18nToOption,
};

export default ChartI18n;
