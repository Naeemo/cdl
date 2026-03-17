// CDL v0.6 Parser - Fixed Implementation
// 修复：图表类型识别和高级块解析

import {
  CDLFile,
  DataDefinition,
  ChartDefinition,
  SeriesConfig,
  AxisConfig,
  InteractionConfig,
  CompileError,
} from './types';

// ===== 注释剥离 =====

export function stripComments(source: string): string {
  const lines = source.split('\n');
  const result: string[] = [];
  let inBlock = false;
  
  for (const raw of lines) {
    let line = '';
    let i = 0;
    
    while (i < raw.length) {
      if (!inBlock && raw.slice(i, i + 2) === '/*') {
        inBlock = true;
        i += 2;
        continue;
      }
      if (inBlock && raw.slice(i, i + 2) === '*/') {
        inBlock = false;
        i += 2;
        continue;
      }
      if (inBlock) {
        i++;
        continue;
      }
      if (raw.slice(i, i + 2) === '//') break;
      line += raw[i];
      i++;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// ===== Markdown 表格 =====

function parseTable(lines: string[], start: number): { headers: string[]; rows: string[][]; end: number } | null {
  const headers: string[] = [];
  const rows: string[][] = [];
  let i = start;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    
    const cells = line.slice(1, -1).split('|').map(c => c.trim());
    if (cells.some(c => c.includes('---'))) {
      i++;
      continue;
    }
    
    if (headers.length === 0) headers.push(...cells);
    else rows.push(cells);
    
    i++;
  }
  
  return headers.length ? { headers, rows, end: i } : null;
}

// ===== 类型推断 =====

const KEYWORD_MAP: Record<string, string> = {
  '趋势': 'line', '变化': 'line', '增长': 'line', '下降': 'line',
  '对比': 'bar', '排名': 'bar', '分布': 'bar',
  '占比': 'pie', '构成': 'pie',
  '关系': 'scatter', '散点': 'scatter',
  '累积': 'area', '面积': 'area',
  '能力': 'radar', '评估': 'radar',
  '热力': 'heatmap', '矩阵': 'heatmap',
  '组合': 'combo', '混合': 'combo', '双轴': 'combo',
  '仪表': 'gauge', '进度': 'gauge',
};

function inferType(title: string, explicit?: string): string {
  if (explicit) {
    const t = explicit.trim();
    return KEYWORD_MAP[t] || t;
  }
  for (const [kw, type] of Object.entries(KEYWORD_MAP)) {
    if (title.includes(kw)) return type;
  }
  return 'line';
}

// ===== 高级块解析 =====

function parseSeries(lines: string[], start: number): { series: SeriesConfig[]; end: number } | null {
  if (!lines[start].trim().startsWith('## series')) return null;
  
  let i = start + 1;
  let headers: string[] = [];
  const series: SeriesConfig[] = [];
  
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    
    const cells = line.slice(1, -1).split('|').map(c => c.trim());
    const cellsLower = cells.map(c => c.toLowerCase()); // 仅用于匹配
    
    if (cellsLower.some(c => c.includes('---'))) {
      i++;
      continue;
    }
    
    if (headers.length === 0) {
      headers = cellsLower; // 表头转为小写
      if (!headers.includes('field')) return null;
    } else {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => row[h] = cells[idx] || ''); // 使用原始值
      if (row.field) {
        series.push({
          field: row.field,
          as: row.as,
          type: row.type as any,
          color: row.color,
          axis: row.axis === 'right' ? 'right' : 'left',
          style: row.style as any,
        });
      }
    }
    
    i++;
  }
  
  return series.length ? { series, end: i } : null;
}

function parseAxis(lines: string[], start: number): { axis: AxisConfig; end: number } | null {
  const m = lines[start].trim().match(/^##\s+axis\s+(\w+)/);
  if (!m) return null;
  
  let pos = m[1].toLowerCase();
  if (pos === 'top') pos = 'x2';
  if (pos === 'bottom') pos = 'y';
  if (pos === 'left') pos = 'y';
  if (pos === 'right') pos = 'y2';
  
  let i = start + 1;
  const axis: AxisConfig = { position: pos as any };
  
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    
    // 遇到新高级块或新图表，停止
    if (trimmed.startsWith('##') || trimmed.startsWith('#') || trimmed.startsWith('@')) break;
    if (!trimmed) {
      i++;
      continue;
    }
    
    const kv = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*(.+)$/);
    if (kv) {
      const [, key, val] = kv;
      switch (key) {
        case 'type': axis.type = val as any; break;
        case 'min': axis.min = isNaN(Number(val)) ? val : Number(val); break;
        case 'max': axis.max = isNaN(Number(val)) ? val : Number(val); break;
        case 'tickCount': axis.tickCount = Number(val); break;
        case 'labelFormatter': axis.labelFormatter = val; break;
        case 'labelRotate': axis.labelRotate = Number(val); break;
        case 'splitLine': axis.splitLine = val === 'true'; break;
      }
    }
    
    i++;
  }
  
  return { axis, end: i };
}

function parseInteraction(str: string): InteractionConfig {
  const cfg: InteractionConfig = {};
  for (const part of str.split(/\s+/)) {
    const kv = part.match(/^(\w+):(.+)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    switch (key) {
      case 'tooltip':
        if (val === 'single' || val === 'shared' || val === 'none') cfg.tooltip = val;
        else cfg.tooltip = 'shared';
        break;
      case 'legend': cfg.legend = val === 'true'; break;
      case 'zoom':
        if (val === 'true') cfg.zoom = true;
        else if (val === 'inside' || val === 'slider') cfg.zoom = val;
        else if (val.startsWith('{')) {
          try {
            const fixed = val.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
            const json = JSON.parse(fixed);
            if (json.type === 'inside' || json.type === 'slider') {
              cfg.zoom = { type: json.type };
            } else if (json.type === true || json.enabled) {
              cfg.zoom = true;
            } else {
              cfg.zoom = true; // 默认
            }
          } catch (e) {
            cfg.zoom = true;
          }
        } else {
          cfg.zoom = true;
        }
        break;
      case 'brush':
        if (val === 'true') cfg.brush = true;
        else if (val.startsWith('{')) {
          try {
            const fixed = val.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
            const json = JSON.parse(fixed);
            if (json.connect) {
              cfg.brush = { connect: Array.isArray(json.connect) ? json.connect : [json.connect] };
            } else if (json.link) {
              cfg.brush = { link: json.link };
            } else {
              cfg.brush = true;
            }
          } catch (e) {
            const match = val.match(/connect\s*:\s*\[([^\]]+)\]|connect\s*:\s*(\S+)/);
            if (match) {
              const targets = match[1] 
                ? match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
                : [match[2]];
              if (targets[0]) cfg.brush = { connect: targets };
            } else {
              cfg.brush = true;
            }
          }
        }
        break;
      // v0.2+ 新增交互
      case 'drillDown':
        if (val === 'true') cfg.drillDown = true;
        else if (val.startsWith('{')) {
          try {
            const fixed = val.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
            const json = JSON.parse(fixed);
            cfg.drillDown = {
              field: json.field,
              maxLevels: json.maxLevels,
              breadcrumb: json.breadcrumb !== false, // 默认 true
            };
          } catch (e) {
            // 简单解析 field=xxx,levels=n
            const fieldMatch = val.match(/field=(\w+)/);
            const levelsMatch = val.match(/levels=(\d+)/);
            cfg.drillDown = {
              field: fieldMatch ? fieldMatch[1] : undefined,
              maxLevels: levelsMatch ? parseInt(levelsMatch[1]) : undefined,
              breadcrumb: true,
            };
          }
        } else {
          cfg.drillDown = true;
        }
        break;
      case 'link':
        if (val === 'true') cfg.link = []; // 空数组表示链接到同页面所有图表
        else if (val.startsWith('[') || val.includes(',')) {
          // 数组格式: chart1,chart2
          const charts = val.replace(/[\[\]'"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
          cfg.link = charts.length ? charts : [];
        } else if (val.startsWith('{')) {
          try {
            const fixed = val.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
            const json = JSON.parse(fixed);
            cfg.link = {
              charts: json.charts || [],
              group: json.group,
              highlight: json.highlight || 'both',
            };
          } catch (e) {
            cfg.link = { charts: [val] };
          }
        } else {
          cfg.link = [val];
        }
        break;
      case 'live':
        if (val === 'stream') cfg.live = 'stream' as const;
        else if (val === 'true') cfg.live = true;
        else if (/^\d+$/.test(val)) {
          cfg.live = parseInt(val, 10);
        } else {
          cfg.live = true;
        }
        break;
      case 'animation':
        if (val === 'true') cfg.animation = {};
        else if (val.startsWith('{')) {
          try {
            const fixed = val.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
            const json = JSON.parse(fixed);
            cfg.animation = {
              easing: json.easing,
              duration: json.duration,
              delay: json.delay,
              loop: json.loop,
            };
          } catch (e) {
            // 简单解析 key=value
            const easingMatch = val.match(/easing=(\w+)/);
            const durationMatch = val.match(/duration=(\d+)/);
            const delayMatch = val.match(/delay=(\d+)/);
            const loopMatch = val.match(/loop=(true|false)/);
            cfg.animation = {
              easing: easingMatch ? easingMatch[1] : undefined,
              duration: durationMatch ? parseInt(durationMatch[1]) : undefined,
              delay: delayMatch ? parseInt(delayMatch[1]) : undefined,
              loop: loopMatch ? loopMatch[1] === 'true' : undefined,
            };
          }
        }
        break;
    }
  }
  return cfg;
}

function formatCSV(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ===== 快速图表解析 =====

function parseQuickChart(
  lines: string[], 
  start: number, 
  errors: CompileError[]
): { chart: ChartDefinition; dataDef: DataDefinition; nextLine: number } | null {
  
  let i = start;
  
  // 标题
  const titleMatch = lines[i].trim().match(/^#\s+(.+)$/);
  if (!titleMatch) return null;
  const title = titleMatch[1];
  i++;
  
  // 跳过空行
  while (i < lines.length && !lines[i].trim()) i++;
  
  // 表格
  const table = parseTable(lines, i);
  if (!table) {
    errors.push({ line: i + 1, column: 0, message: 'Expected markdown table', severity: 'error' });
    return null;
  }
  i = table.end;
  
  // === 修复 1: 跳过空行，找到图表类型指令（如果有）===
  while (i < lines.length && !lines[i].trim()) i++;
  
  // 图表类型
  let chartType: string;
  if (i < lines.length) {
    const typeLine = lines[i].trim();
    const typeMatch = typeLine.match(/^##\s+(.+)$/);
    if (typeMatch) {
      chartType = inferType(title, typeMatch[1]);
      i++;
    } else {
      chartType = inferType(title);
    }
  } else {
    chartType = inferType(title);
  }
  
  // 跳过空行
  while (i < lines.length && !lines[i].trim()) i++;
  
  // 收集高级块（## series, ## axis, @hints）
  const hints: Record<string, string> = {};
  const seriesList: SeriesConfig[] = [];
  const axisList: AxisConfig[] = [];
  let hasSeries = false;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // === 修复 2: 只在一级标题 (# ) 时跳出（新图表开始），允许 ## 高级块处理 ===
    if (line.startsWith('# ') || line === '---') break;
    
    if (!line) {
      i++;
      continue;
    }
    
    // series
    const s = parseSeries(lines, i);
    if (s) {
      seriesList.push(...s.series);
      i = s.end;
      hasSeries = true;
      continue;
    }
    
    // axis
    const a = parseAxis(lines, i);
    if (a) {
      axisList.push(a.axis);
      i = a.end;
      continue;
    }
    
    // @hints
    const hintMatch = line.match(/^@(\w+)\s+(?:"([^"]*)"|'([^']*)'|(\S+))/);
    if (hintMatch) {
      const [, key, q1, q2, unq] = hintMatch;
      const val = q1 || q2 || unq || '';
      if (key === 'interaction') hints.interaction = val;
      else hints[key] = val;
    }
    
    i++;
  }
  
  // 数据定义
  const dataName = title + '_data';
  const dataDef: DataDefinition = {
    type: 'data',
    name: dataName,
    lang: 'data',
    config: {},
    query: formatCSV(table.headers, table.rows),
  };
  
  // 图表定义
  const chart: ChartDefinition = {
    type: 'chart',
    name: title,
    chartType,
    dataSources: [dataName],
    hints,
  };
  
  if (!hasSeries) {
    chart.x = table.headers[0];
    chart.y = table.headers[1];
    if (table.headers.length >= 3) chart.group = table.headers[2];
  } else {
    chart.series = seriesList;
  }
  
  if (axisList.length > 0) chart.axis = axisList;
  
  // 处理提示中的 stack
  if (hints.stack === 'true') {
    chart.stack = true;
  }
  
  if (hints.interaction) {
    chart.interaction = parseInteraction(hints.interaction);
    delete hints.interaction;
  }
  
  return { chart, dataDef, nextLine: i };
}

// ===== 主入口 =====

export function parseV05(source: string): { file: CDLFile; errors: CompileError[] } {
  const errors: CompileError[] = [];
  const file: CDLFile = { data: [], charts: [] };
  
  const lines = source.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line || line === '---') {
      i++;
      continue;
    }
    
    // 数据源定义
    if (line.startsWith('@lang')) {
      let directives: any = {};
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('@')) {
        const m = lines[j].trim().match(/^@(\w+)(?:\(([^)]*)\))?\s*$/);
        if (m) {
          const [, key, val] = m;
          if (key === 'lang') directives.lang = val;
          else if (key === 'source') directives.source = val?.replace(/^["']|["']$/g, '').trim();
          else if (key === 'timeout') directives.timeout = Number(val);
          else if (key === 'cache') directives.cache = Number(val);
        }
        j++;
      }
      
      if (!directives.lang) {
        errors.push({ line: i + 1, column: 0, message: 'Missing @lang directive', severity: 'error' });
        i = j;
        continue;
      }
      
      let bodyStart = j;
      while (bodyStart < lines.length && !lines[bodyStart].trim().includes('{')) bodyStart++;
      if (bodyStart >= lines.length) {
        errors.push({ line: i + 1, column: 0, message: 'Expected "{" after directives', severity: 'error' });
        i = j;
        continue;
      }
      
      const nameMatch = lines[bodyStart].trim().match(/(\w+)\s*\{/);
      if (!nameMatch) {
        errors.push({ line: bodyStart + 1, column: 0, message: 'Expected data source name before "{"', severity: 'error' });
        i = bodyStart + 1;
        continue;
      }
      const dataName = nameMatch[1];
      
      let query = '';
      let braceCount = 1;
      let k = bodyStart + 1;
      while (k < lines.length && braceCount > 0) {
        const txt = lines[k];
        for (const c of txt) {
          if (c === '{') braceCount++;
          else if (c === '}') braceCount--;
          if (braceCount > 0 || c !== '}') query += c;
        }
        k++;
      }
      
      file.data.push({
        type: 'data',
        name: dataName,
        lang: directives.lang as any,
        config: {
          source: directives.source,
          timeout: directives.timeout,
          cache: directives.cache,
        },
        query: query.trim(),
      });
      
      i = k;
      continue;
    }
    
    // Chart 定义块 (完整语法)
    if (line.toLowerCase().startsWith('chart')) {
      const result = parseChartBlock(lines, i, errors);
      if (result) {
        file.charts.push(result.chart);
      }
      i = result ? result.nextLine : i + 1;
      continue;
    }
    
    // 快速图表 (Markdown 表格语法)
    if (line.startsWith('#')) {
      const result = parseQuickChart(lines, i, errors);
      if (result) {
        file.charts.push(result.chart);
        file.data.push(result.dataDef);
      }
      i = result ? result.nextLine : i + 1;
      continue;
    }
    
    i++;
  }
  
  return { file, errors };
}

// 解析 Chart { ... } 块
function parseChartBlock(
  lines: string[],
  start: number,
  errors: CompileError[]
): { chart: ChartDefinition; nextLine: number } | null {
  
  const line = lines[start].trim();
  const nameMatch = line.match(/^Chart\s*(?:\{|\s+(\w+)\s*\{)/);
  if (!nameMatch) return null;
  
  const chartName = nameMatch[1] || undefined;
  
  // 找到对应的 }
  let braceCount = 0;
  let foundOpen = false;
  let endLine = start;
  
  for (let k = start; k < lines.length; k++) {
    const txt = lines[k];
    for (const c of txt) {
      if (c === '{') {
        braceCount++;
        foundOpen = true;
      } else if (c === '}') {
        braceCount--;
        if (foundOpen && braceCount === 0) {
          endLine = k;
          break;
        }
      }
    }
    if (foundOpen && braceCount === 0) break;
  }
  
  if (braceCount !== 0) {
    errors.push({ line: start + 1, column: 0, message: 'Unclosed Chart block', severity: 'error' });
    return null;
  }
  
  // 提取块内容
  const blockLines: string[] = [];
  for (let k = start + 1; k < endLine; k++) {
    blockLines.push(lines[k]);
  }
  
  // 解析块内容
  const chart = parseChartBody(blockLines, chartName, errors);
  if (!chart) return null;
  
  return { chart, nextLine: endLine + 1 };
}

// 解析 Chart 块内部
function parseChartBody(
  lines: string[],
  name?: string,
  errors: CompileError[] = []
): ChartDefinition | null {
  
  const chart: ChartDefinition = {
    type: 'chart',
    name,
    chartType: 'line', // default
    dataSources: [],
    series: [],
    axis: [],
    hints: {},
  };
  
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line) {
      i++;
      continue;
    }
    
    // use DataSource
    const useMatch = line.match(/^use\s+(\w+)$/);
    if (useMatch) {
      chart.dataSources.push(useMatch[1]);
      i++;
      continue;
    }
    
    // type: chartType
    const typeMatch = line.match(/^type\s*:\s*(\w+)$/);
    if (typeMatch) {
      chart.chartType = typeMatch[1];
      i++;
      continue;
    }
    
    // x, y, group, stack (support both "x: field" and "x field")
    const assignMatch = line.match(/^(x|y|group|stack)\s*(?::\s*|\s+)(\w+)$/);
    if (assignMatch) {
      const [, field, value] = assignMatch;
      if (field === 'x') chart.x = value;
      else if (field === 'y') chart.y = value;
      else if (field === 'group') chart.group = value;
      else if (field === 'stack') chart.stack = value === 'true' || value === 'group';
      i++;
      continue;
    }
    
    // series array (multi-series)
    if (line.startsWith('series:')) {
      const seriesVal = line.slice(7).trim();
      if (seriesVal === 'true') {
        // Enable auto-series from data
        chart.series = [];
      } else if (seriesVal.startsWith('[')) {
        // Inline array: series: [field1, field2]
        try {
          const arr = JSON.parse(seriesVal.replace(/'/g, '"'));
          chart.series = arr.map((name: string) => ({ field: name }));
        } catch {
          errors.push({ line: i + 1, column: 0, message: 'Invalid series array syntax', severity: 'error' });
        }
      }
      i++;
      continue;
    }
    
    // @hints (style, color, animation, title, subtitle, layout, theme, grid, interaction)
    const hintMatch = line.match(/^@(\w+)\s+(?:"([^"]*)"|'([^']*)'|(\S+))/);
    if (hintMatch) {
      const [, key, q1, q2, unq] = hintMatch;
      const val = q1 || q2 || unq || '';
      const allowedKeys = ['style', 'color', 'animation', 'title', 'subtitle', 'layout', 'theme', 'grid', 'interaction'] as const;
      if (allowedKeys.includes(key as any)) {
        (chart.hints as any)[key] = val;
      }
      i++;
      continue;
    }
    
    i++;
  }
  
  // Post-process hints into structured interaction
  if (chart.hints.interaction) {
    chart.interaction = parseInteraction(chart.hints.interaction);
    delete chart.hints.interaction;
  }
  
  // Ensure we have at least one data source
  if (chart.dataSources.length === 0) {
    errors.push({ line: 0, column: 0, message: 'Chart must have at least one data source (use <name>)', severity: 'error' });
    return null;
  }
  
  return chart;
}

export function compile(source: string): { file: CDLFile; errors: CompileError[] } {
  return parseV05(stripComments(source));
}

export function validate(source: string): { valid: boolean; errors: CompileError[] } {
  const result = compile(source);
  return {
    valid: result.errors.length === 0 && result.file.charts.length > 0,
    errors: result.errors,
  };
}