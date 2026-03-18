// Error Message Enhancer for CDL
// 提供友好的错误提示和可操作的修复建议

import { CompileError } from './types';

/**
 * 常见错误模式和建议
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  code: string;
  message: string;
  suggestion: string;
  examples?: string[];
}> = [
  {
    pattern: /Unclosed.*block/i,
    code: 'UNCLOSED_BLOCK',
    message: '缺少闭合括号 "}"',
    suggestion: '确保每个 Chart 块都有对应的闭合括号。检查第 {line} 行附近是否缺少 "}"。',
    examples: [
      'Chart 销售 { ... }  // ✅ 正确',
      'Chart 销售 { ...    // ❌ 缺少 }'
    ]
  },
  {
    pattern: /Invalid series array syntax/i,
    code: 'INVALID_SERIES_ARRAY',
    message: 'series 数组语法错误',
    suggestion: '使用正确的 JSON 数组格式，例如: series: [field1, field2]。确保使用双引号或有效的 JSON 格式。',
    examples: [
      'series: [销售额, 利润]  // ✅ 简单字段',
      "series: ['销售额', '利润']  // ✅ 明确字符串"
    ]
  },
  {
    pattern: /Chart must have at least one data source/i,
    code: 'MISSING_DATA_SOURCE',
    message: 'Chart 必须引用至少一个数据源',
    suggestion: '在 Chart 块中使用 "use DataName" 来引用前面定义的数据源。确保 DataName 存在且名称匹配。',
    examples: [
      '@lang(data) Sales { month, amount; 1月,100 }',
      'Chart { use Sales; type line; x month; y amount }  // ✅'
    ]
  },
  {
    pattern: /Unknown chart type/i,
    code: 'UNKNOWN_CHART_TYPE',
    message: '未知的图表类型',
    suggestion: 'CDL 支持的图表类型包括: line, bar, pie, scatter, area, radar, heatmap, gauge, candlestick, boxplot, sankey, treemap, wordcloud, liquid, map, funnel, sunburst, graph, parallel, combo。检查拼写或使用 auto 自动推断。',
    examples: [
      'type line   // ✅ 折线图',
      'type combo  // ✅ 组合图'
    ]
  },
  {
    pattern: /field.*not found/i,
    code: 'FIELD_NOT_FOUND',
    message: '字段名不存在',
    suggestion: '检查字段名是否与数据源定义中完全一致（包括大小写）。数据源定义的字段列表: {fields}。',
    examples: [
      'Data { month, sales }',
      'Chart { x month; y sales }  // ✅ 字段匹配'
    ]
  },
  {
    pattern: /Missing.*field/i,
    code: 'MISSING_REQUIRED_FIELD',
    message: '缺少必需的字段',
    suggestion: '图表类型 "{}" 需要以下字段: {required}。请确保在 Chart 定义中提供这些字段。',
    examples: [
      'type line 需要: x (分类/时间), y (数值)',
      'type pie 需要: x (名称), y (数值)'
    ]
  },
  {
    pattern: /duplicate.*name/i,
    code: 'DUPLICATE_NAME',
    message: '名称重复',
    suggestion: '数据源名称必须唯一。请为不同的数据块使用不同的名称。',
    examples: [
      '@lang(data) Sales1 { ... }',
      '@lang(data) Sales2 { ... }  // ✅ 不同名称'
    ]
  },
  {
    pattern: /syntax error/i,
    code: 'SYNTAX_ERROR',
    message: '语法错误',
    suggestion: '检查 CDL 语法规范。常见问题: 缺少冒号、括号不匹配、表格格式错误。确保 Markdown 表格使用 "|" 分隔且表头下方有 "---" 行。',
    examples: [
      '| 月份 | 销售额 |  // ✅',
      '| 月份 | 销售额   // ❌ 缺少右 |',
      '| --- | --- |      // ✅ 分隔行'
    ]
  }
];

/**
 * 为错误添加增强信息
 */
export function enhanceError(error: CompileError, sourceLines: string[] = []): CompileError {
  const lineContent = sourceLines[error.line - 1] || '';
  const enhanced = { ...error };

  // 尝试匹配已知错误模式
  for (const entry of ERROR_PATTERNS) {
    if (entry.pattern.test(error.message)) {
      enhanced.code = entry.code;
      enhanced.suggestion = entry.suggestion
        .replace('{line}', error.line.toString())
        .replace('{fields}', extractFieldsFromLine(lineContent))
        .replace('{required}', getRequiredFieldsForType(error.message));
      break;
    }
  }

  // 添加上下文
  if (lineContent && !enhanced.context) {
    enhanced.context = lineContent.trim();
  }

  // 如果仍有空白 message，提供通用建议
  if (!enhanced.suggestion) {
    enhanced.suggestion = getGenericSuggestion(error.message);
  }

  return enhanced;
}

/**
 * 从行内容提取字段名（用于错误建议）
 */
function extractFieldsFromLine(line: string): string {
  // 尝试从类似 "Data { month, sales }" 的行提取字段
  const match = line.match(/\{\s*([^}]+)\s*\}/);
  if (match) {
    return match[1].split(',').map(f => f.trim()).join(', ');
  }
  return '检查数据源定义的字段列表';
}

/**
 * 根据错误消息推断所需字段
 */
function getRequiredFieldsForType(message: string): string {
  if (message.includes('line') || message.includes('趋势')) return 'x (时间/分类), y (数值)';
  if (message.includes('bar') || message.includes('柱状')) return 'x (分类), y (数值)';
  if (message.includes('pie') || message.includes('饼图')) return 'x (名称), y (数值)';
  if (message.includes('scatter') || message.includes('散点')) return 'x (数值), y (数值)';
  return 'x, y (请参考图表类型文档)';
}

/**
 * 通用错误建议
 */
function getGenericSuggestion(message: string): string {
  if (message.includes('undefined')) {
    return '某个变量未定义。检查是否漏掉了数据源定义或字段引用。';
  }
  if (message.includes('syntax')) {
    return '语法错误。请参考 GRAMMAR.md 或文档中的语法示例。';
  }
  return '请检查该行的语法是否正确，或查阅文档中的示例。';
}

/**
 * 格式化错误消息以便显示
 */
export function formatError(error: CompileError, enhance: boolean = true): string {
  const e = enhance ? enhanceError(error) : error;
  let msg = `Line ${e.line}: ${e.message}`;

  if (e.code) {
    msg += ` [${e.code}]`;
  }

  if (e.suggestion) {
    msg += `\n   💡 建议: ${e.suggestion}`;
  }

  if (e.context) {
    const snippet = e.context.length > 60 ? e.context.substring(0, 60) + '...' : e.context;
    msg += `\n   📄 代码: ${snippet}`;
  }

  return msg;
}

/**
 * 批量增强错误列表
 */
export function enhanceAllErrors(errors: CompileError[], source: string): CompileError[] {
  const lines = source.split('\n');
  return errors.map(err => enhanceError(err, lines));
}