// Error Hints for Unified Markdown Syntax

import { CompileError } from './types';

const ERROR_HINTS: Record<string, string> = {
  'Expected markdown table': '图表需要数据表格：| 列1 | 列2 |',
  'Expected # title': '图表需要以 # 标题 开头',
  'Invalid chart type': '图表类型应为: line, bar, pie, scatter, area, radar, combo',
  'Missing x field': '在 ## map 中定义 x: 字段名 或确保数据第一列为x轴',
  'Missing y field': '在 ## map 中定义 y: 字段名 或确保数据第二列为y轴',
};

export function enhanceError(error: CompileError, source: string): CompileError {
  const hint = ERROR_HINTS[error.message];
  if (hint) {
    return { ...error, suggestion: hint };
  }
  return error;
}

export function enhanceAllErrors(errors: CompileError[], source: string): CompileError[] {
  return errors.map(e => enhanceError(e, source));
}

export function formatError(error: CompileError): string {
  let msg = `Line ${error.line}: ${error.message}`;
  if (error.suggestion) msg += `\n  → ${error.suggestion}`;
  return msg;
}
