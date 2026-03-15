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
    
    // 快速图表
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