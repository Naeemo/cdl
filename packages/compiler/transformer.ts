/**
 * CDL 数据转换器
 * 支持 CSV/JSON/Excel 格式的导入导出
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== 类型定义 =====

export type DataFormat = 'csv' | 'json' | 'excel' | 'xlsx' | 'xls';

export interface DataRow {
  [key: string]: string | number | boolean | null | Date;
}

export interface DataTable {
  headers: string[];
  rows: DataRow[];
  sheetName?: string;  // Excel 专用：工作表名称
}

export interface ImportOptions {
  format?: DataFormat;
  sheetName?: string;           // Excel: 指定工作表名
  sheetIndex?: number;          // Excel: 指定工作表索引
  headerRow?: number;           // Excel/CSV: 表头行索引 (0-based)
  dataStartRow?: number;        // 数据起始行索引
  delimiter?: string;           // CSV: 分隔符
  encoding?: string;            // 文件编码
  parseNumbers?: boolean;       // 自动解析数字
  parseDates?: boolean;         // 自动解析日期
}

export interface ExportOptions {
  format?: DataFormat;
  sheetName?: string;           // Excel: 工作表名
  delimiter?: string;           // CSV: 分隔符
  includeHeader?: boolean;      // 是否包含表头
  encoding?: string;            // 文件编码
  bom?: boolean;                // CSV: 是否添加 BOM (UTF-8)
  prettify?: boolean;           // JSON: 格式化输出
  columnWidths?: Record<string, number>;  // Excel: 列宽配置
}

export interface ConvertResult {
  success: boolean;
  data?: DataTable;
  filePath?: string;
  error?: string;
}

// ===== CSV 处理 =====

/**
 * 解析 CSV 文本为数据表
 */
export function parseCSV(csvText: string, options: ImportOptions = {}): DataTable {
  const delimiter = options.delimiter || ',';
  const parseNumbers = options.parseNumbers !== false;
  const parseDates = options.parseDates !== false;
  
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headerRowIndex = options.headerRow ?? 0;
  const dataStartIndex = options.dataStartRow ?? (headerRowIndex + 1);
  
  // 解析表头
  const headers = parseCSVLine(lines[headerRowIndex], delimiter);
  
  // 解析数据行
  const rows: DataRow[] = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line, delimiter);
    const row: DataRow = {};
    
    headers.forEach((header, index) => {
      const rawValue = values[index] ?? '';
      row[header] = parseValue(rawValue, parseNumbers, parseDates);
    });
    
    rows.push(row);
  }
  
  return { headers, rows };
}

/**
 * 解析单行 CSV（处理引号包裹的字段）
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 转义的引号
        current += '"';
        i++; // 跳过下一个引号
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * 将数据表序列化为 CSV 文本
 */
export function serializeCSV(table: DataTable, options: ExportOptions = {}): string {
  const delimiter = options.delimiter || ',';
  const includeHeader = options.includeHeader !== false;
  const bom = options.bom !== false; // 默认添加 BOM
  
  const lines: string[] = [];
  
  // 表头
  if (includeHeader && table.headers.length > 0) {
    lines.push(table.headers.map(h => escapeCSVField(h, delimiter)).join(delimiter));
  }
  
  // 数据行
  for (const row of table.rows) {
    const values = table.headers.map(header => {
      const value = row[header];
      const strValue = value === null || value === undefined ? '' : String(value);
      return escapeCSVField(strValue, delimiter);
    });
    lines.push(values.join(delimiter));
  }
  
  const csvContent = lines.join('\n');
  
  // 添加 BOM 以支持 Excel 正确识别 UTF-8
  if (bom) {
    return '\ufeff' + csvContent;
  }
  
  return csvContent;
}

/**
 * 转义 CSV 字段（需要时添加引号）
 */
function escapeCSVField(field: string, delimiter: string): string {
  // 如果包含分隔符、引号或换行符，需要引号包裹
  if (field.includes(delimiter) || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

// ===== JSON 处理 =====

/**
 * 解析 JSON 文本为数据表
 * 支持格式: 对象数组 或 { headers: [], rows: [] }
 */
export function parseJSON(jsonText: string, options: ImportOptions = {}): DataTable {
  const parsed = JSON.parse(jsonText);
  
  // 已经是 DataTable 格式
  if (parsed.headers && Array.isArray(parsed.rows)) {
    return {
      headers: parsed.headers,
      rows: parsed.rows,
      sheetName: parsed.sheetName
    };
  }
  
  // 对象数组格式
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // 从第一行提取表头
    const firstRow = parsed[0];
    const headers = Object.keys(firstRow);
    
    const rows: DataRow[] = parsed.map((item: any) => {
      const row: DataRow = {};
      headers.forEach(header => {
        row[header] = normalizeValue(item[header]);
      });
      return row;
    });
    
    return { headers, rows };
  }
  
  throw new Error('Unsupported JSON format. Expected array of objects or DataTable format.');
}

/**
 * 将数据表序列化为 JSON 文本
 */
export function serializeJSON(table: DataTable, options: ExportOptions = {}): string {
  const prettify = options.prettify !== false; // 默认格式化
  
  // 转换为对象数组格式（更通用）
  const data = table.rows;
  
  if (prettify) {
    return JSON.stringify(data, null, 2);
  }
  
  return JSON.stringify(data);
}

// ===== Excel 处理 =====

// 动态导入 xlsx 库
let XLSX: any = null;

async function loadXLSX(): Promise<any> {
  if (XLSX) return XLSX;
  
  try {
    // 尝试使用动态导入
    const module = await import('xlsx');
    XLSX = module.default || module;
    return XLSX;
  } catch (error) {
    throw new Error(
      'Excel support requires "xlsx" package. ' +
      'Please install it: npm install xlsx'
    );
  }
}

/**
 * 解析 Excel 文件为数据表
 */
export async function parseExcel(
  buffer: Buffer,
  options: ImportOptions = {}
): Promise<DataTable> {
  const XLSX = await loadXLSX();
  
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // 选择工作表
  let sheetName: string;
  if (options.sheetName) {
    sheetName = options.sheetName;
  } else if (options.sheetIndex !== undefined) {
    sheetName = workbook.SheetNames[options.sheetIndex] || workbook.SheetNames[0];
  } else {
    sheetName = workbook.SheetNames[0];
  }
  
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  
  // 转换为 JSON
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length === 0) {
    return { headers: [], rows: [], sheetName };
  }
  
  const headerRowIndex = options.headerRow ?? 0;
  const dataStartIndex = options.dataStartRow ?? (headerRowIndex + 1);
  
  const headers = jsonData[headerRowIndex].map(h => String(h ?? ''));
  
  const rows: DataRow[] = [];
  for (let i = dataStartIndex; i < jsonData.length; i++) {
    const rowData = jsonData[i];
    if (!rowData || rowData.length === 0) continue;
    
    const row: DataRow = {};
    headers.forEach((header, index) => {
      const value = rowData[index];
      row[header] = normalizeValue(value);
    });
    
    rows.push(row);
  }
  
  return { headers, rows, sheetName };
}

/**
 * 将数据表序列化为 Excel 文件
 */
export async function serializeExcel(
  table: DataTable,
  options: ExportOptions = {}
): Promise<Buffer> {
  const XLSX = await loadXLSX();
  
  const sheetName = options.sheetName || table.sheetName || 'Sheet1';
  
  // 构建二维数组
  const data: any[][] = [];
  
  if (options.includeHeader !== false) {
    data.push(table.headers);
  }
  
  for (const row of table.rows) {
    const rowData = table.headers.map(header => row[header] ?? '');
    data.push(rowData);
  }
  
  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // 设置列宽
  if (options.columnWidths) {
    worksheet['!cols'] = table.headers.map(header => ({
      wch: options.columnWidths![header] || 15
    }));
  }
  
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // 生成 Buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// ===== 核心转换函数 =====

/**
 * 从文件导入数据
 */
export async function importFromFile(
  filePath: string,
  options: ImportOptions = {}
): Promise<ConvertResult> {
  try {
    // 自动检测格式
    const format = options.format || detectFormat(filePath);
    
    // 读取文件
    const content = fs.readFileSync(filePath);
    
    let table: DataTable;
    
    switch (format) {
      case 'csv':
        const csvText = content.toString((options.encoding || 'utf-8') as BufferEncoding);
        table = parseCSV(csvText, options);
        break;
        
      case 'json':
        const jsonText = content.toString((options.encoding || 'utf-8') as BufferEncoding);
        table = parseJSON(jsonText, options);
        break;
        
      case 'excel':
      case 'xlsx':
      case 'xls':
        table = await parseExcel(content, options);
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    return { success: true, data: table };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 导出数据到文件
 */
export async function exportToFile(
  table: DataTable,
  filePath: string,
  options: ExportOptions = {}
): Promise<ConvertResult> {
  try {
    // 自动检测格式
    const format = options.format || detectFormat(filePath);
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    let content: string | Buffer;
    
    switch (format) {
      case 'csv':
        content = serializeCSV(table, options);
        fs.writeFileSync(filePath, content, { encoding: (options.encoding || 'utf-8') as BufferEncoding });
        break;
        
      case 'json':
        content = serializeJSON(table, options);
        fs.writeFileSync(filePath, content, { encoding: (options.encoding || 'utf-8') as BufferEncoding });
        break;
        
      case 'excel':
      case 'xlsx':
      case 'xls':
        content = await serializeExcel(table, options);
        fs.writeFileSync(filePath, content);
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 在内存中转换数据格式
 */
export async function convertData(
  input: DataTable | string | Buffer,
  fromFormat: DataFormat,
  toFormat: DataFormat,
  importOptions: ImportOptions = {},
  exportOptions: ExportOptions = {}
): Promise<ConvertResult> {
  try {
    let table: DataTable;
    
    // 解析输入
    if (typeof input === 'string') {
      // 字符串输入
      switch (fromFormat) {
        case 'csv':
          table = parseCSV(input, importOptions);
          break;
        case 'json':
          table = parseJSON(input, importOptions);
          break;
        default:
          throw new Error(`String input not supported for format: ${fromFormat}`);
      }
    } else if (Buffer.isBuffer(input)) {
      // Buffer 输入
      switch (fromFormat) {
        case 'csv':
          table = parseCSV(input.toString(), importOptions);
          break;
        case 'json':
          table = parseJSON(input.toString(), importOptions);
          break;
        case 'excel':
        case 'xlsx':
        case 'xls':
          table = await parseExcel(input, importOptions);
          break;
        default:
          throw new Error(`Buffer input not supported for format: ${fromFormat}`);
      }
    } else {
      // DataTable 输入
      table = input;
    }
    
    // 序列化输出
    switch (toFormat) {
      case 'csv':
        return {
          success: true,
          data: table,
          filePath: serializeCSV(table, exportOptions)
        };
      case 'json':
        return {
          success: true,
          data: table,
          filePath: serializeJSON(table, exportOptions)
        };
      case 'excel':
      case 'xlsx':
      case 'xls':
        const buffer = await serializeExcel(table, exportOptions);
        return {
          success: true,
          data: table,
          filePath: buffer.toString('base64') // 返回 base64 编码
        };
      default:
        throw new Error(`Unsupported output format: ${toFormat}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===== 辅助函数 =====

/**
 * 检测文件格式
 */
export function detectFormat(filePath: string): DataFormat {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.csv':
      return 'csv';
    case '.json':
      return 'json';
    case '.xlsx':
      return 'xlsx';
    case '.xls':
      return 'xls';
    default:
      throw new Error(`Cannot detect format from extension: ${ext}`);
  }
}

/**
 * 解析单个值
 */
function parseValue(value: string, parseNumbers: boolean, parseDates: boolean): string | number | Date | null {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  // 尝试解析数字
  if (parseNumbers) {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
  }
  
  // 尝试解析日期 (简单格式)
  if (parseDates) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{4}\/\d{2}\/\d{2}$/,           // YYYY/MM/DD
      /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
      /^\d{2}\/\d{2}\/\d{4}$/,           // MM/DD/YYYY
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // ISO 8601
    ];
    
    if (datePatterns.some(p => p.test(value))) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return value;
}

/**
 * 标准化值（从 Excel/JSON 导入时）
 */
function normalizeValue(value: any): string | number | boolean | null | Date {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  return String(value);
}

/**
 * 验证数据表结构
 */
export function validateTable(table: DataTable): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!table.headers || !Array.isArray(table.headers)) {
    errors.push('Missing or invalid headers');
    return { valid: false, errors };
  }
  
  if (!table.rows || !Array.isArray(table.rows)) {
    errors.push('Missing or invalid rows');
    return { valid: false, errors };
  }
  
  // 检查每行是否有所有表头字段
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    for (const header of table.headers) {
      if (!(header in row)) {
        errors.push(`Row ${i} missing field: ${header}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * 创建空数据表
 */
export function createEmptyTable(headers: string[] = []): DataTable {
  return { headers, rows: [] };
}

/**
 * 添加行到数据表
 */
export function addRow(table: DataTable, row: DataRow): DataTable {
  // 自动扩展表头
  const newHeaders = new Set(table.headers);
  Object.keys(row).forEach(key => newHeaders.add(key));
  
  return {
    ...table,
    headers: Array.from(newHeaders),
    rows: [...table.rows, row]
  };
}

/**
 * 合并多个数据表
 */
export function mergeTables(tables: DataTable[]): DataTable {
  if (tables.length === 0) {
    return createEmptyTable();
  }
  
  // 收集所有表头
  const allHeaders = new Set<string>();
  tables.forEach(t => t.headers.forEach(h => allHeaders.add(h)));
  const headers = Array.from(allHeaders);
  
  // 合并所有行
  const rows: DataRow[] = [];
  tables.forEach(t => {
    t.rows.forEach(row => {
      const newRow: DataRow = {};
      headers.forEach(h => {
        newRow[h] = row[h] ?? null;
      });
      rows.push(newRow);
    });
  });
  
  return { headers, rows };
}

// ===== CLI 入口 =====

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('CDL Data Transformer - CSV/JSON/Excel Converter');
    console.log('');
    console.log('Usage:');
    console.log('  ts-node transformer.ts import <file> [options]');
    console.log('  ts-node transformer.ts export <file> <data> [options]');
    console.log('  ts-node transformer.ts convert <input> <output> [options]');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node transformer.ts import data.csv --format=csv');
    console.log('  ts-node transformer.ts export output.xlsx data.json --format=excel');
    process.exit(1);
  }
  
  const command = args[0];
  
  // 简单 CLI 实现
  (async () => {
    try {
      switch (command) {
        case 'import': {
          const filePath = args[1];
          const result = await importFromFile(filePath);
          if (result.success) {
            console.log(JSON.stringify(result.data, null, 2));
          } else {
            console.error('Error:', result.error);
            process.exit(1);
          }
          break;
        }
        
        case 'convert': {
          const inputFile = args[1];
          const outputFile = args[2];
          
          const importResult = await importFromFile(inputFile);
          if (!importResult.success) {
            console.error('Import error:', importResult.error);
            process.exit(1);
          }
          
          const exportResult = await exportToFile(importResult.data!, outputFile);
          if (exportResult.success) {
            console.log(`Converted: ${inputFile} -> ${outputFile}`);
          } else {
            console.error('Export error:', exportResult.error);
            process.exit(1);
          }
          break;
        }
        
        default:
          console.error('Unknown command:', command);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
