/**
 * CDL Data Transformer Integration
 * 
 * 将数据转换器集成到 CDL 编译器工作流中
 * 支持在 CDL 中直接使用 @import 和 @export 指令
 */

import {
  importFromFile,
  exportToFile,
  convertData,
  DataTable,
  ImportOptions,
  ExportOptions,
  DataFormat
} from './transformer';

export * from './transformer';

// ===== CDL 指令解析 =====

export interface ImportDirective {
  type: 'import';
  filePath: string;
  format?: DataFormat;
  options: ImportOptions;
}

export interface ExportDirective {
  type: 'export';
  filePath: string;
  format?: DataFormat;
  options: ExportOptions;
}

/**
 * 解析 @import 指令
 * 
 * 语法：
 * @import "data.csv"
 * @import "data.xlsx" { sheetName: "Sheet1" }
 * @import "data.json" { format: "json" }
 */
export function parseImportDirective(directive: string): ImportDirective | null {
  // 匹配 @import "filepath" { options }
  const match = directive.match(/@import\s+"([^"]+)"(?:\s*\{([^}]*)\})?/);
  if (!match) return null;
  
  const [, filePath, optionsStr] = match;
  const options: ImportOptions = {};
  
  // 解析选项
  if (optionsStr) {
    const pairs = optionsStr.match(/(\w+)\s*:\s*([^,\s]+)/g) || [];
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.trim());
      // 尝试解析为数字或布尔值
      if (value === 'true') (options as any)[key] = true;
      else if (value === 'false') (options as any)[key] = false;
      else if (!isNaN(Number(value))) (options as any)[key] = Number(value);
      else (options as any)[key] = value.replace(/^["']|["']$/g, '');
    });
  }
  
  return {
    type: 'import',
    filePath,
    format: options.format,
    options
  };
}

/**
 * 解析 @export 指令
 * 
 * 语法：
 * @export "output.csv"
 * @export "output.xlsx" { sheetName: "Results" }
 */
export function parseExportDirective(directive: string): ExportDirective | null {
  // 匹配 @export "filepath" { options }
  const match = directive.match(/@export\s+"([^"]+)"(?:\s*\{([^}]*)\})?/);
  if (!match) return null;
  
  const [, filePath, optionsStr] = match;
  const options: ExportOptions = {};
  
  // 解析选项
  if (optionsStr) {
    const pairs = optionsStr.match(/(\w+)\s*:\s*([^,\s]+)/g) || [];
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (value === 'true') (options as any)[key] = true;
      else if (value === 'false') (options as any)[key] = false;
      else if (!isNaN(Number(value))) (options as any)[key] = Number(value);
      else (options as any)[key] = value.replace(/^["']|["']$/g, '');
    });
  }
  
  return {
    type: 'export',
    filePath,
    format: options.format,
    options
  };
}

// ===== 数据源集成 =====

import { DataDefinition, DataSourceConfig } from './src/types';

export interface FileDataSourceConfig extends DataSourceConfig {
  format?: DataFormat;
  filePath?: string;
  importOptions?: ImportOptions;
}

/**
 * 从文件创建数据定义
 */
export async function createDataDefinitionFromFile(
  name: string,
  filePath: string,
  options: ImportOptions = {}
): Promise<{ def: DataDefinition; data: DataTable }> {
  const result = await importFromFile(filePath, options);
  
  if (!result.success) {
    throw new Error(`Failed to import ${filePath}: ${result.error}`);
  }
  
  const def: DataDefinition = {
    type: 'data',
    name,
    lang: 'data',
    config: {
      source: filePath,
      format: options.format,
      ...options
    },
    query: ''
  };
  
  return { def, data: result.data! };
}

// ===== 图表数据导出 =====

import { ChartDefinition } from './src/types';

export interface ChartDataExport {
  chartName: string;
  chartType: string;
  data: DataTable;
  exportedAt: Date;
}

/**
 * 从图表定义和数据导出数据
 */
export async function exportChartData(
  chart: ChartDefinition,
  data: DataTable,
  filePath: string,
  options: ExportOptions = {}
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  // 添加图表元数据到导出
  const enrichedTable: DataTable = {
    ...data,
    rows: data.rows.map((row, index) => ({
      _index: index,
      ...row
    }))
  };
  
  const result = await exportToFile(enrichedTable, filePath, options);
  
  return result;
}

/**
 * 批量导出多个图表数据
 */
export async function exportMultipleCharts(
  exports: Array<{ chart: ChartDefinition; data: DataTable; filePath: string }>,
  options: ExportOptions = {}
): Promise<Array<{ chartName: string; result: { success: boolean; filePath?: string; error?: string } }>> {
  const results = [];
  
  for (const { chart, data, filePath } of exports) {
    const result = await exportChartData(chart, data, filePath, options);
    results.push({
      chartName: chart.name || 'unnamed',
      result
    });
  }
  
  return results;
}

// ===== 数据管道 =====

export interface DataPipeline {
  name: string;
  steps: Array<{
    type: 'import' | 'transform' | 'export';
    config: any;
  }>;
}

/**
 * 执行数据管道
 */
export async function executeDataPipeline(
  pipeline: DataPipeline
): Promise<{ success: boolean; results?: DataTable[]; error?: string }> {
  try {
    const results: DataTable[] = [];
    let currentData: DataTable | null = null;
    
    for (const step of pipeline.steps) {
      switch (step.type) {
        case 'import': {
          const result = await importFromFile(step.config.filePath, step.config.options);
          if (!result.success) {
            throw new Error(`Import failed: ${result.error}`);
          }
          currentData = result.data!;
          results.push(currentData);
          break;
        }
        
        case 'transform': {
          if (!currentData) {
            throw new Error('No data to transform');
          }
          // 使用 transform.ts 中的转换函数
          const { applyTransforms } = require('./transform');
          const transformed: any[] = applyTransforms(currentData.rows, step.config.pipeline);
          currentData = { headers: currentData.headers, rows: transformed, sheetName: currentData.sheetName };
          results.push(currentData);
          break;
        }
        
        case 'export': {
          if (!currentData) {
            throw new Error('No data to export');
          }
          const result = await exportToFile(currentData, step.config.filePath, step.config.options);
          if (!result.success) {
            throw new Error(`Export failed: ${result.error}`);
          }
          break;
        }
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== 便捷函数 =====

/**
 * CSV 转 JSON（便捷函数）
 */
export async function csvToJson(csvText: string, options: ImportOptions = {}): Promise<any[]> {
  const result = await convertData(csvText, 'csv', 'json', options, { prettify: false });
  if (!result.success) {
    throw new Error(result.error);
  }
  return JSON.parse(result.filePath as string);
}

/**
 * JSON 转 CSV（便捷函数）
 */
export async function jsonToCsv(jsonData: any[], options: ExportOptions = {}): Promise<string> {
  const table: DataTable = {
    headers: Object.keys(jsonData[0] || {}),
    rows: jsonData
  };
  return serializeCSV(table, options);
}

/**
 * 从 URL 导入数据
 */
export async function importFromUrl(
  url: string,
  options: ImportOptions = {}
): Promise<{ success: boolean; data?: DataTable; error?: string }> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const json = await response.json();
      const table = parseJSON(JSON.stringify(json), options);
      return { success: true, data: table };
    } else {
      const text = await response.text();
      const table = parseCSV(text, options);
      return { success: true, data: table };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 需要导入的函数
import { parseCSV, parseJSON, serializeCSV } from './transformer';

// ===== 导出 =====

export default {
  importFromFile,
  exportToFile,
  convertData,
  parseImportDirective,
  parseExportDirective,
  createDataDefinitionFromFile,
  exportChartData,
  executeDataPipeline,
  csvToJson,
  jsonToCsv,
  importFromUrl
};
