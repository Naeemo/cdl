// CDL Unified Parser - Markdown Style Only (v0.7)
// No backward compatibility - pure Markdown syntax

import {
  CDLFile,
  DataDefinition,
  ChartDefinition,
  SeriesConfig,
  AxisConfig,
  InteractionConfig,
  CompileError,
} from './types';
import { enhanceAllErrors } from './error-hints';

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

// Main entry: parse markdown-style CDL
export function parse(source: string): { file: CDLFile; errors: CompileError[] } {
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
    
    // Parse markdown chart: # Title + data + ## type
    if (line.startsWith('# ')) {
      const result = parseChartSection(lines, i, errors);
      if (result) {
        file.charts.push(result.chart);
        if (result.dataDef) file.data.push(result.dataDef);
        i = result.nextLine;
        continue;
      }
    }
    
    // Parse data block: ```sql Name or ## data
    if (line.startsWith('```') || line === '## data') {
      const result = parseDataBlock(lines, i, errors);
      if (result) {
        file.data.push(result.data);
        i = result.nextLine;
        continue;
      }
    }
    
    i++;
  }
  
  return { file, errors };
}

function parseChartSection(
  lines: string[],
  start: number,
  errors: CompileError[]
): { chart: ChartDefinition; dataDef?: DataDefinition; nextLine: number } | null {
  let i = start;
  
  // Parse title: # Title
  const titleMatch = lines[i].trim().match(/^#\s+(.+)$/);
  if (!titleMatch) return null;
  const title = titleMatch[1];
  i++;
  
  // Skip empty lines
  while (i < lines.length && !lines[i].trim()) i++;
  
  // Parse inline data table or reference
  let dataDef: DataDefinition | undefined;
  let dataName: string;
  
  if (i < lines.length && lines[i].trim().startsWith('|')) {
    // Inline data table
    const table = parseTable(lines, i);
    if (table) {
      dataName = `${title}_data`;
      dataDef = {
        type: 'data',
        name: dataName,
        lang: 'data',
        config: {},
        query: formatCSV(table.headers, table.rows),
      };
      i = table.end;
    }
  }
  
  // Skip empty lines
  while (i < lines.length && !lines[i].trim()) i++;
  
  // Parse chart type: ## line/bar/pie/...
  let chartType = 'line';
  if (i < lines.length && lines[i].trim().startsWith('## ')) {
    const typeLine = lines[i].trim().slice(3).trim();
    chartType = inferType(title, typeLine);
    i++;
  }
  
  // Initialize chart
  const chart: ChartDefinition = {
    type: 'chart',
    name: title,
    chartType,
    x: '',
    y: '',
    hints: {},
  };
  
  // Parse optional sections
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Stop at new chart or end
    if (line.startsWith('# ') && !line.startsWith('## ')) break;
    if (line === '---') break;
    
    if (!line) {
      i++;
      continue;
    }
    
    // Parse @hints: @color, @style, @title, etc.
    if (line.startsWith('@')) {
      const hintMatch = line.match(/^@(\w+)\s+(?:"([^"]*)"|'([^']*)'|(\S+))/);
      if (hintMatch) {
        const [, key, q1, q2, unq] = hintMatch;
        const val = q1 || q2 || unq || '';
        (chart.hints as any)[key] = val;
        if (key === 'interaction') {
          chart.interaction = parseInteraction(val);
        }
      }
      i++;
      continue;
    }
    
    // Parse ## series block
    if (line === '## series') {
      const result = parseSeriesBlock(lines, i);
      if (result) {
        chart.series = result.series;
        i = result.end;
      }
      continue;
    }
    
    // Parse ## axis block
    if (line.startsWith('## axis')) {
      const result = parseAxisBlock(lines, i);
      if (result) {
        if (!chart.axis) chart.axis = [];
        chart.axis.push(result.axis);
        i = result.end;
      }
      continue;
    }
    
    // Parse ## map block
    if (line === '## map') {
      const result = parseMapBlock(lines, i);
      if (result) {
        chart.x = result.x;
        chart.y = result.y;
        if (result.group) chart.group = result.group;
        i = result.end;
      }
      continue;
    }
    
    i++;
  }
  
  // Auto-detect x/y if not mapped
  if (!chart.x && dataDef) {
    const lines = dataDef.query.split('\n');
    if (lines.length > 0) {
      const headers = lines[0].split(',');
      chart.x = headers[0] || '';
      chart.y = headers[1] || '';
    }
  }
  
  return { chart, dataDef, nextLine: i };
}

function parseTable(lines: string[], start: number): ParsedTable & { end: number } | null {
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

function parseDataBlock(lines: string[], start: number, errors: CompileError[]): { data: DataDefinition; nextLine: number } | null {
  const line = lines[start].trim();
  
  // Format: ```sql DataName or ## data
  if (line.startsWith('```')) {
    const match = line.match(/^```(\w+)(?:\s+(\w+))?/);
    if (!match) return null;
    
    const lang = match[1] as any;
    const name = match[2] || `${lang}_data`;
    let i = start + 1;
    let query = '';
    
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      query += lines[i] + '\n';
      i++;
    }
    
    return {
      data: {
        type: 'data',
        name,
        lang,
        config: {},
        query: query.trim(),
      },
      nextLine: i + 1,
    };
  }
  
  return null;
}

function parseSeriesBlock(lines: string[], start: number): { series: SeriesConfig[]; end: number } | null {
  if (lines[start].trim() !== '## series') return null;
  
  let i = start + 1;
  let headers: string[] = [];
  const series: SeriesConfig[] = [];
  
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    
    const cells = line.slice(1, -1).split('|').map(c => c.trim());
    const cellsLower = cells.map(c => c.toLowerCase());
    
    if (cellsLower.some(c => c.includes('---'))) {
      i++;
      continue;
    }
    
    if (headers.length === 0) {
      headers = cellsLower;
    } else {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => row[h] = cells[idx] || '');
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

function parseAxisBlock(lines: string[], start: number): { axis: AxisConfig; end: number } | null {
  const m = lines[start].trim().match(/^##\s+axis\s+(\w+)(?:\s+(\w+))?/);
  if (!m) return null;
  
  let pos = m[1].toLowerCase();
  const side = m[2]?.toLowerCase();
  if (side && ['left', 'right'].includes(side)) {
    pos = side === 'right' ? 'y2' : 'y';
  }
  
  let i = start + 1;
  const axis: AxisConfig = { position: pos as any };
  
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('```')) break;
    if (!trimmed) { i++; continue; }
    
    const kv = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
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

function parseMapBlock(lines: string[], start: number): { x: string; y: string; group?: string; end: number } | null {
  if (lines[start].trim() !== '## map') return null;
  
  let i = start + 1;
  let x = '', y = '', group = '';
  
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#')) break;
    if (!trimmed) { i++; continue; }
    
    const kv = trimmed.match(/^(x|y|group)\s*:\s*(\w+)$/);
    if (kv) {
      if (kv[1] === 'x') x = kv[2];
      else if (kv[1] === 'y') y = kv[2];
      else if (kv[1] === 'group') group = kv[2];
    }
    i++;
  }
  
  return x && y ? { x, y, group: group || undefined, end: i } : null;
}

function formatCSV(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function inferType(title: string, explicit?: string): string {
  const KEYWORD_MAP: Record<string, string> = {
    '趋势': 'line', '变化': 'line', '增长': 'line',
    '对比': 'bar', '排名': 'bar',
    '占比': 'pie', '构成': 'pie',
    '关系': 'scatter', '散点': 'scatter',
    '累积': 'area', '面积': 'area',
    '能力': 'radar', '评估': 'radar',
    '热力': 'heatmap', '组合': 'combo', '混合': 'combo',
  };
  
  if (explicit) {
    return KEYWORD_MAP[explicit] || explicit;
  }
  for (const [kw, type] of Object.entries(KEYWORD_MAP)) {
    if (title.includes(kw)) return type;
  }
  return 'line';
}

function parseInteraction(str: string): InteractionConfig {
  const cfg: InteractionConfig = {};
  for (const part of str.split(/\s+/)) {
    const kv = part.match(/^(\w+):(.+)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    switch (key) {
      case 'tooltip': cfg.tooltip = val as any; break;
      case 'zoom': cfg.zoom = val === 'true' ? true : val as any; break;
      case 'brush': cfg.brush = val === 'true'; break;
    }
  }
  return cfg;
}

export function compile(source: string): { file: CDLFile; errors: CompileError[] } {
  const result = parse(source);
  result.errors = enhanceAllErrors(result.errors, source);
  return result;
}

export function validate(source: string): { valid: boolean; errors: CompileError[] } {
  const result = compile(source);
  return {
    valid: result.errors.length === 0 && result.file.charts.length > 0,
    errors: result.errors,
  };
}
