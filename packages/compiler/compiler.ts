/**
 * CDL Compiler v0.2 - Simplified
 * 将 CDL 源码编译为带类型的 JSON AST
 */

import { readFileSync } from 'node:fs';
import {
  CDLFile,
  DataDefinition,
  ChartDefinition,
  ChartType,
  ChartSeries,
  ChartHint,
  QueryLanguage,
  DataSourceConfig,
  CompileResult,
  CompileError,
} from './types';

// ===== 公开 API =====

/**
 * 编译 CDL 源码为 AST
 */
export function compile(source: string): CompileResult {
  const errors: CompileError[] = [];
  
  try {
    // Step 1: Strip comments
    const cleanSource = stripComments(source);
    
    // Step 2: Parse
    const file = parseCDL(cleanSource, errors);

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, result: file, errors: [] };
  } catch (e) {
    return {
      success: false,
      errors: [{
        line: 0,
        column: 0,
        message: e instanceof Error ? e.message : 'Unknown error',
        severity: 'error',
      }],
    };
  }
}

/**
 * 验证 CDL 源码语法（不生成 AST，只检查错误）
 * 适合 AI 快速检查生成的代码
 */
export function validate(source: string): { valid: boolean; errors: CompileError[] } {
  const result = compile(source);
  return {
    valid: result.success,
    errors: result.errors,
  };
}

// ===== 注释移除 =====

function stripComments(source: string): string {
  let result = '';
  let i = 0;
  
  while (i < source.length) {
    // Single line comment //
    if (source.slice(i, i + 2) === '//') {
      while (i < source.length && source[i] !== '\n') {
        i++;
      }
      continue;
    }
    
    // Multi-line comment /* */
    if (source.slice(i, i + 2) === '/*') {
      i += 2;
      while (i < source.length - 1 && !(source[i] === '*' && source[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }
    
    result += source[i];
    i++;
  }
  
  return result;
}

// ===== 简单解析器 =====

function parseCDL(source: string, errors: CompileError[]): CDLFile {
  const file: CDLFile = { data: [], charts: [] };
  const lines = source.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }
    
    // Parse @ directives and Data/Chart
    if (line.startsWith('@') || line.match(/^(Data|Chart)\s/)) {
      const result = parseBlock(lines, i, errors);
      if (result.block) {
        if (result.block.type === 'data') {
          file.data.push(result.block);
        } else {
          file.charts.push(result.block);
        }
      }
      i = result.nextIndex;
    } else {
      i++;
    }
  }
  
  return file;
}

function parseBlock(
  lines: string[], 
  startIndex: number, 
  errors: CompileError[]
): { block?: DataDefinition | ChartDefinition; nextIndex: number } {
  let i = startIndex;
  const line = lines[i].trim();
  
  // Collect @ directives
  const directives: Record<string, string | number | boolean> = {};
  while (i < lines.length && lines[i].trim().startsWith('@')) {
    const dirLine = lines[i].trim();
    const match = dirLine.match(/@(\w+)\s*(?:\(\s*([^)]*)\s*\))?/);
    if (match) {
      const name = match[1];
      const value = match[2] ? parseValue(match[2]) : true;
      directives[name] = value;
    }
    i++;
  }
  
  // Check for Data or Chart
  if (i >= lines.length) {
    return { nextIndex: i };
  }
  
  const declLine = lines[i].trim();
  
  // Parse Data
  if (declLine.startsWith('Data ') || (!declLine.startsWith('Chart ') && !declLine.startsWith('use ') && declLine.includes('{'))) {
    return parseDataBlock(lines, i, directives, errors);
  }
  
  // Parse Chart
  if (declLine.startsWith('Chart ')) {
    return parseChartBlock(lines, i, directives, errors);
  }
  
  return { nextIndex: i + 1 };
}

function parseDataBlock(
  lines: string[],
  startIndex: number,
  directives: Record<string, unknown>,
  errors: CompileError[]
): { block?: DataDefinition; nextIndex: number } {
  let i = startIndex;
  const line = lines[i].trim();
  
  // Extract name
  const nameMatch = line.match(/(?:Data\s+)?(\w+)\s*\{/);
  const name = nameMatch?.[1] || 'unnamed';
  
  // Find opening brace
  let braceIndex = line.indexOf('{');
  if (braceIndex === -1) {
    // Look for { on next lines
    i++;
    while (i < lines.length && !lines[i].includes('{')) i++;
    braceIndex = lines[i]?.indexOf('{') ?? -1;
  }
  
  i++;
  
  // Collect query content until closing brace
  let query = '';
  let braceCount = 1;
  
  while (i < lines.length && braceCount > 0) {
    const contentLine = lines[i];
    for (const char of contentLine) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      
      if (braceCount > 0 || char !== '}') {
        query += char;
      }
    }
    query += '\n';
    i++;
  }
  
  const config: DataSourceConfig = {};
  if (directives.source) {
    config.source = String(directives.source);
    // 检测是否为 REST API URL
    if (config.source.match(/^https?:\/\//)) {
      directives.lang = 'rest';
    }
  }
  if (directives.timeout) config.timeout = Number(directives.timeout);
  if (directives.cache) config.cache = Number(directives.cache);
  
  const block: DataDefinition = {
    type: 'data',
    name,
    lang: (directives.lang as QueryLanguage) || 'data',
    config,
    query: query.trim(),
  };
  
  return { block, nextIndex: i };
}

function parseChartBlock(
  lines: string[],
  startIndex: number,
  hints: Record<string, unknown>,
  errors: CompileError[]
): { block?: ChartDefinition; nextIndex: number } {
  let i = startIndex;
  const line = lines[i].trim();
  
  // Extract optional name
  const nameMatch = line.match(/Chart\s+(\w+)?\s*\{/);
  const name = nameMatch?.[1];
  
  // Find opening brace
  let braceIndex = line.indexOf('{');
  if (braceIndex === -1) {
    i++;
    while (i < lines.length && !lines[i].includes('{')) i++;
  }
  
  i++;
  
  // Parse chart body
  const chart: ChartDefinition = {
    type: 'chart',
    name,
    chartType: 'line',
    dataSources: [],
    hints: {},
  };
  
  let braceCount = 1;
  
  while (i < lines.length && braceCount > 0) {
    const contentLine = lines[i].trim();
    
    for (const char of contentLine) {
      if (char === '{') braceCount++;
      else if (char === '}') {
        braceCount--;
        if (braceCount === 0) break;
      }
    }
    
    if (braceCount === 0) {
      i++;
      break;
    }
    
    // Parse properties
    if (contentLine.startsWith('use ')) {
      const match = contentLine.match(/use\s+(\w+)/);
      if (match) chart.dataSources.push(match[1]);
    } else if (contentLine.startsWith('type ')) {
      const match = contentLine.match(/type\s+(\w+)/);
      if (match) chart.chartType = match[1] as ChartType;
    } else if (contentLine.startsWith('x ')) {
      const match = contentLine.match(/x\s+(\w+)/);
      if (match) chart.x = match[1];
    } else if (contentLine.startsWith('y ')) {
      const match = contentLine.match(/y\s+(\w+)/);
      if (match) chart.y = match[1];
    } else if (contentLine.startsWith('group ')) {
      const match = contentLine.match(/group\s+(\w+)/);
      if (match) chart.group = match[1];
    } else if (contentLine.startsWith('stack ')) {
      const match = contentLine.match(/stack\s+(\w+)/);
      if (match) {
        chart.stack = match[1] === 'true' ? true : match[1];
      }
    } else if (contentLine.startsWith('@')) {
      // Parse @ hints
      const match = contentLine.match(/@(\w+)\s+"([^"]*)"/);
      if (match) {
        const hintName = match[1] as keyof ChartHint;
        if (!chart.hints) chart.hints = {};
        (chart.hints as Record<string, string>)[hintName] = match[2];
      }
    }
    
    i++;
  }
  
  // Merge directives as hints
  Object.entries(hints).forEach(([key, value]) => {
    if (key !== 'lang' && typeof value === 'string') {
      if (!chart.hints) chart.hints = {};
      (chart.hints as Record<string, string>)[key] = value;
    }
  });
  
  return { block: chart, nextIndex: i };
}

function parseValue(value: string): string | number | boolean {
  value = value.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value);
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

// ===== CLI =====

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ts-node compiler.ts <file.cdl>');
    process.exit(1);
  }

  const source = readFileSync(filePath, { encoding: 'utf-8' });
  const result = compile(source);

  if (result.success) {
    console.log(JSON.stringify(result.result, null, 2));
  } else {
    console.error('Compilation errors:');
    result.errors.forEach(e => {
      console.error(`  Line ${e.line}, Col ${e.column}: ${e.message}`);
    });
    process.exit(1);
  }
}
