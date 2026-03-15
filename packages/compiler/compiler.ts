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