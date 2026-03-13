/**
 * CDL 性能分析工具
 * 用于分析编译和渲染性能
 */

export interface PerformanceMetrics {
  compileTime: number;
  renderTime: number;
  dataProcessingTime: number;
  totalTime: number;
  memoryUsage?: number;
  dataSize: {
    rows: number;
    columns: number;
    bytes: number;
  };
}

export interface PerformanceReport {
  success: boolean;
  metrics: PerformanceMetrics;
  warnings: string[];
  suggestions: string[];
}

/**
 * 测量编译性能
 */
export function measureCompile(source: string, compileFn: (s: string) => any): { result: any; time: number } {
  const start = performance.now();
  const result = compileFn(source);
  const time = performance.now() - start;
  return { result, time };
}

/**
 * 测量渲染性能
 */
export function measureRender(ast: any, renderFn: (a: any) => any): { result: any; time: number } {
  const start = performance.now();
  const result = renderFn(ast);
  const time = performance.now() - start;
  return { result, time };
}

/**
 * 分析 CDL 性能
 */
export function analyzePerformance(
  source: string,
  compileFn: (s: string) => any,
  renderFn: (a: any) => any
): PerformanceReport {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // 测量编译
  const compileStart = performance.now();
  const compileResult = compileFn(source);
  const compileTime = performance.now() - compileStart;
  
  if (!compileResult.success) {
    return {
      success: false,
      metrics: null as any,
      warnings: ['Compilation failed'],
      suggestions: ['Fix syntax errors before performance analysis']
    };
  }
  
  // 测量渲染
  const renderStart = performance.now();
  const renderResult = renderFn(compileResult.result);
  const renderTime = performance.now() - renderStart;
  
  // 计算数据大小
  const bytes = new TextEncoder().encode(source).length;
  let totalRows = 0;
  let totalColumns = 0;
  
  if (compileResult.result.data) {
    compileResult.result.data.forEach((d: any) => {
      if (d.query) {
        const lines = d.query.split('\n').filter((l: string) => l.trim());
        totalRows += lines.length;
        if (lines[0]) {
          totalColumns = Math.max(totalColumns, lines[0].split(',').length);
        }
      }
    });
  }
  
  const metrics: PerformanceMetrics = {
    compileTime,
    renderTime,
    dataProcessingTime: 0,
    totalTime: compileTime + renderTime,
    dataSize: {
      rows: totalRows,
      columns: totalColumns,
      bytes
    }
  };
  
  // 生成警告和建议
  if (compileTime > 100) {
    warnings.push(`编译耗时较长 (${compileTime.toFixed(2)}ms)`);
    suggestions.push('考虑减少代码行数或简化数据结构');
  }
  
  if (totalRows > 1000) {
    warnings.push(`数据量较大 (${totalRows} 行)`);
    suggestions.push('使用 @cache 指令缓存数据');
    suggestions.push('考虑在数据源端进行聚合');
  }
  
  if (bytes > 100000) {
    warnings.push(`文件较大 (${(bytes / 1024).toFixed(1)} KB)`);
    suggestions.push('考虑拆分多个 CDL 文件');
  }
  
  if (compileResult.result.charts?.length > 10) {
    warnings.push(`图表数量较多 (${compileResult.result.charts.length} 个)`);
    suggestions.push('考虑分页或延迟加载');
  }
  
  return {
    success: true,
    metrics,
    warnings,
    suggestions
  };
}

/**
 * 格式化性能报告
 */
export function formatPerformanceReport(report: PerformanceReport): string {
  const lines: string[] = [];
  
  if (!report.success) {
    lines.push('❌ Performance analysis failed');
    report.warnings.forEach(w => lines.push(`  ⚠️  ${w}`));
    return lines.join('\n');
  }
  
  const m = report.metrics;
  
  lines.push('📊 CDL Performance Report\n');
  
  lines.push('⏱️  Timing:');
  lines.push(`  Compile: ${m.compileTime.toFixed(2)}ms`);
  lines.push(`  Render:  ${m.renderTime.toFixed(2)}ms`);
  lines.push(`  Total:   ${m.totalTime.toFixed(2)}ms`);
  lines.push('');
  
  lines.push('📦 Data Size:');
  lines.push(`  Rows:    ${m.dataSize.rows}`);
  lines.push(`  Columns: ${m.dataSize.columns}`);
  lines.push(`  Bytes:   ${m.dataSize.bytes} (${(m.dataSize.bytes / 1024).toFixed(1)} KB)`);
  lines.push('');
  
  if (report.warnings.length > 0) {
    lines.push('⚠️  Warnings:');
    report.warnings.forEach(w => lines.push(`  - ${w}`));
    lines.push('');
  }
  
  if (report.suggestions.length > 0) {
    lines.push('💡 Suggestions:');
    report.suggestions.forEach(s => lines.push(`  - ${s}`));
  }
  
  return lines.join('\n');
}