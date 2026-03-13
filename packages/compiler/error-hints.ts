/**
 * CDL 错误提示系统
 * 提供友好的错误信息和修复建议
 */

export interface FriendlyError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  suggestion?: string;
  fix?: string; // 自动修复建议
  docs?: string; // 文档链接
}

// 常见错误模式
const errorPatterns = [
  {
    code: 'MISSING_BRACE',
    pattern: /unexpected end of input|missing.*brace/i,
    message: (ctx: string) => `缺少闭合括号 '}'`,
    suggestion: (ctx: string) => '检查是否缺少 "}" 来关闭块',
    fix: (ctx: string) => ctx + '\n}'
  },
  {
    code: 'MISSING_DATA_NAME',
    pattern: /Data\s*\{/,
    message: () => `Data 定义缺少名称`,
    suggestion: () => 'Data 定义需要名称，例如: Data SalesData {}',
    fix: (ctx: string) => ctx.replace('Data {', 'Data MyData {')
  },
  {
    code: 'INVALID_CHART_TYPE',
    pattern: /type\s+(\w+)/,
    message: (ctx: string, match?: RegExpMatchArray) => `不支持的图表类型 "${match?.[1] || ''}"`,
    suggestion: () => '支持的类型: line, bar, pie, scatter, area, radar',
    validValues: ['line', 'bar', 'pie', 'scatter', 'area', 'radar', 'heatmap', 'gauge']
  },
  {
    code: 'MISSING_USE_DIRECTIVE',
    pattern: /Chart.*\{[^}]*\}/s,
    message: () => `Chart 缺少 use 指令`,
    suggestion: () => 'Chart 需要使用数据源，例如: use SalesData',
    fix: (ctx: string) => ctx.replace('Chart', 'Chart {\n    use DataName')
  },
  {
    code: 'UNKNOWN_DIRECTIVE',
    pattern: /@(\w+)/,
    message: (ctx: string, match?: RegExpMatchArray) => `未知指令 "@${match?.[1] || ''}"`,
    suggestion: () => '可用指令: @source, @timeout, @cache, @params, @style, @color, @title, @animation'
  },
  {
    code: 'INVALID_URL_FORMAT',
    pattern: /@source\(['"]([^'"]+)['"]\)/,
    message: () => `URL 格式不正确`,
    suggestion: () => 'URL 应以 http://, https://, ws:// 或 wss:// 开头'
  },
  {
    code: 'QUOTES_MISMATCH',
    pattern: /["'][^"']*$/,
    message: () => `引号不匹配`,
    suggestion: () => '检查字符串引号是否成对闭合'
  },
  {
    code: 'INVALID_SYNTAX',
    pattern: /use\s*[^A-Za-z]/,
    message: () => `use 语法错误`,
    suggestion: () => 'use 后面应跟数据源名称，例如: use SalesData'
  }
];

/**
 * 分析错误并生成友好提示
 */
export function analyzeError(
  source: string,
  errorLine: number,
  errorColumn: number,
  rawMessage: string
): FriendlyError {
  const lines = source.split('\n');
  const context = lines[errorLine - 1] || '';
  
  // 尝试匹配错误模式
  for (const pattern of errorPatterns) {
    const match = context.match(pattern.pattern) || rawMessage.match(pattern.pattern);
    if (match) {
      return {
        line: errorLine,
        column: errorColumn,
        message: pattern.message(context, match),
        severity: 'error',
        code: pattern.code,
        suggestion: pattern.suggestion(),
        fix: pattern.fix?.(context),
        docs: `https://cdl.dev/docs/errors#${pattern.code.toLowerCase()}`
      };
    }
  }
  
  // 默认错误
  return {
    line: errorLine,
    column: errorColumn,
    message: rawMessage,
    severity: 'error',
    code: 'UNKNOWN_ERROR',
    suggestion: '请检查 CDL 语法',
    docs: 'https://cdl.dev/docs/syntax'
  };
}

/**
 * 验证 CDL 源码并返回所有错误
 */
export function validateWithHints(source: string): FriendlyError[] {
  const errors: FriendlyError[] = [];
  const lines = source.split('\n');
  
  // 检查常见错误
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // 检查 Data 定义
    if (line.match(/^Data\s*\{/)) {
      errors.push({
        line: lineNum,
        column: line.indexOf('{') + 1,
        message: 'Data 定义缺少名称',
        severity: 'error',
        code: 'MISSING_DATA_NAME',
        suggestion: '使用 "Data SalesData {" 而不是 "Data {"',
        fix: line.replace('Data {', 'Data SalesData {')
      });
    }
    
    // 检查 Chart use
    if (line.match(/^Chart\s+\w*\s*\{/) && !source.includes('use ')) {
      const hasUseInBlock = lines.slice(idx).some((l, i) => 
        i < 10 && l.includes('use ')
      );
      if (!hasUseInBlock) {
        errors.push({
          line: lineNum,
          column: 1,
          message: 'Chart 缺少数据源引用',
          severity: 'warning',
          code: 'MISSING_USE_DIRECTIVE',
          suggestion: '在 Chart 块内添加 "use DataName"'
        });
      }
    }
    
    // 检查引号
    const quoteCount = (line.match(/["']/g) || []).length;
    if (quoteCount % 2 !== 0) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: '引号不匹配',
        severity: 'error',
        code: 'QUOTES_MISMATCH',
        suggestion: '确保字符串引号成对出现'
      });
    }
    
    // 检查未知指令
    const directiveMatch = line.match(/@(\w+)/);
    if (directiveMatch) {
      const knownDirectives = ['source', 'timeout', 'cache', 'params', 'lang', 
                               'style', 'color', 'title', 'animation', 'interaction', 'layout'];
      if (!knownDirectives.includes(directiveMatch[1])) {
        errors.push({
          line: lineNum,
          column: line.indexOf('@') + 1,
          message: `未知指令 "@${directiveMatch[1]}"`,
          severity: 'warning',
          code: 'UNKNOWN_DIRECTIVE',
          suggestion: `可用指令: ${knownDirectives.join(', ')}`
        });
      }
    }
    
    // 检查图表类型
    const typeMatch = line.match(/type\s+(\w+)/);
    if (typeMatch) {
      const validTypes = ['line', 'bar', 'pie', 'scatter', 'area', 'radar', 'heatmap', 'gauge'];
      if (!validTypes.includes(typeMatch[1])) {
        errors.push({
          line: lineNum,
          column: line.indexOf(typeMatch[1]) + 1,
          message: `不支持的图表类型 "${typeMatch[1]}"`,
          severity: 'error',
          code: 'INVALID_CHART_TYPE',
          suggestion: `支持的类型: ${validTypes.join(', ')}`
        });
      }
    }
  });
  
  // 检查括号匹配
  let braceCount = 0;
  let lastOpenBrace = 0;
  lines.forEach((line, idx) => {
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        lastOpenBrace = idx + 1;
      } else if (char === '}') {
        braceCount--;
      }
    }
  });
  
  if (braceCount > 0) {
    errors.push({
      line: lastOpenBrace,
      column: 1,
      message: `缺少 ${braceCount} 个闭合括号 '}'`,
      severity: 'error',
      code: 'MISSING_BRACE',
      suggestion: '在文件末尾添加 "}" 或检查括号匹配'
    });
  } else if (braceCount < 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `多余的闭合括号 '}'`,
      severity: 'error',
      code: 'EXTRA_BRACE',
      suggestion: '删除多余的 "}" 或检查括号匹配'
    });
  }
  
  return errors;
}

/**
 * 格式化错误输出（适合 CLI 显示）
 */
export function formatErrorForCLI(error: FriendlyError, source?: string): string {
  const lines: string[] = [];
  
  // 错误位置和代码
  lines.push(`\n❌ ${error.code}`);
  lines.push(`   Line ${error.line}, Column ${error.column}`);
  lines.push(`   ${error.message}`);
  
  // 源代码上下文
  if (source) {
    const sourceLines = source.split('\n');
    const start = Math.max(0, error.line - 3);
    const end = Math.min(sourceLines.length, error.line + 2);
    
    lines.push('');
    for (let i = start; i < end; i++) {
      const lineNum = i + 1;
      const prefix = lineNum === error.line ? ' > ' : '   ';
      lines.push(`${prefix}${lineNum.toString().padStart(4)} | ${sourceLines[i]}`);
      if (lineNum === error.line) {
        const pointer = ' '.repeat(7 + error.column) + '^';
        lines.push(pointer);
      }
    }
  }
  
  // 建议
  if (error.suggestion) {
    lines.push('');
    lines.push(`💡 ${error.suggestion}`);
  }
  
  // 自动修复
  if (error.fix) {
    lines.push('');
    lines.push(`🔧 建议修复:`);
    lines.push(`   ${error.fix}`);
  }
  
  // 文档链接
  if (error.docs) {
    lines.push('');
    lines.push(`📖 ${error.docs}`);
  }
  
  return lines.join('\n');
}