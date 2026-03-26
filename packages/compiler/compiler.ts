/**
 * CDL Compiler v0.6 - Complete Rewrite
 * 将 CDL 源码编译为带类型的 JSON AST
 */

export { compile, validate } from './src/v06-parser';
export type {
  QueryLanguage,
  DataSourceConfig,
  DataDefinition,
  ChartType,
  SeriesConfig,
  AxisConfig,
  InteractionConfig,
  ChartHint,
  ChartDefinition,
  CDLFile,
  CompileError,
  CompileResult,
  ValidationResult,
} from './src/types';

// Data Transformer exports
export {
  // Core functions
  importFromFile,
  exportToFile,
  convertData,
  parseCSV,
  parseJSON,
  parseExcel,
  serializeCSV,
  serializeJSON,
  serializeExcel,
  
  // Utility functions
  createEmptyTable,
  addRow,
  mergeTables,
  validateTable,
  detectFormat,
  
  // Types
  type DataFormat,
  type DataRow,
  type DataTable,
  type ImportOptions,
  type ExportOptions,
  type ConvertResult,
} from './transformer';

// Integration exports
export {
  // Directive parsing
  parseImportDirective,
  parseExportDirective,
  
  // Data source integration
  createDataDefinitionFromFile,
  exportChartData,
  exportMultipleCharts,
  executeDataPipeline,
  
  // Convenience functions
  csvToJson,
  jsonToCsv,
  importFromUrl,
  
  // Types
  type ImportDirective,
  type ExportDirective,
  type DataPipeline,
  type ChartDataExport,
} from './transformer-integration';