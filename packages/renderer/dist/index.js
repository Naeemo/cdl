"use strict";
// ECharts Renderer for CDL v0.6
// 入口文件：重新导出核心渲染函数、i18n支持、性能优化
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimizationSuggestions = exports.createPerformanceStats = exports.optimizeChartOption = exports.generateOptimizedTooltip = exports.generateDataZoomConfig = exports.generateProgressiveConfig = exports.applyPerformanceOptimization = exports.parsePerformanceHints = exports.optimizeData = exports.PerformanceMonitor = exports.LazyDataLoader = exports.ProgressiveRenderer = exports.aggregateData = exports.getVirtualScrollRange = exports.sampleData = exports.randomSampling = exports.minMaxSampling = exports.averageSampling = exports.lttbSampling = exports.getSupportedLocales = exports.detectBrowserLocale = exports.initLocales = exports.applyI18nToOption = exports.translateAggregation = exports.createGaugeFormatter = exports.createPieTooltipFormatter = exports.createTooltipFormatter = exports.translateTitle = exports.translateLegendNames = exports.translateSeriesName = exports.translateAxisName = exports.getChartTypeName = exports.ChartI18n = exports.BuiltInKeys = exports.formatDate = exports.formatNumber = exports.configureI18n = exports.getLocale = exports.setLocale = exports.t = exports.getRenderLocale = exports.setRenderLocale = exports.render = void 0;
var renderer_v06_1 = require("./renderer-v06");
Object.defineProperty(exports, "render", { enumerable: true, get: function () { return renderer_v06_1.render; } });
Object.defineProperty(exports, "setRenderLocale", { enumerable: true, get: function () { return renderer_v06_1.setRenderLocale; } });
Object.defineProperty(exports, "getRenderLocale", { enumerable: true, get: function () { return renderer_v06_1.getRenderLocale; } });
// 导出 i18n 模块
var index_1 = require("./i18n/index");
Object.defineProperty(exports, "t", { enumerable: true, get: function () { return index_1.t; } });
Object.defineProperty(exports, "setLocale", { enumerable: true, get: function () { return index_1.setLocale; } });
Object.defineProperty(exports, "getLocale", { enumerable: true, get: function () { return index_1.getLocale; } });
Object.defineProperty(exports, "configureI18n", { enumerable: true, get: function () { return index_1.configureI18n; } });
Object.defineProperty(exports, "formatNumber", { enumerable: true, get: function () { return index_1.formatNumber; } });
Object.defineProperty(exports, "formatDate", { enumerable: true, get: function () { return index_1.formatDate; } });
Object.defineProperty(exports, "BuiltInKeys", { enumerable: true, get: function () { return index_1.BuiltInKeys; } });
var chart_i18n_1 = require("./i18n/chart-i18n");
Object.defineProperty(exports, "ChartI18n", { enumerable: true, get: function () { return chart_i18n_1.ChartI18n; } });
Object.defineProperty(exports, "getChartTypeName", { enumerable: true, get: function () { return chart_i18n_1.getChartTypeName; } });
Object.defineProperty(exports, "translateAxisName", { enumerable: true, get: function () { return chart_i18n_1.translateAxisName; } });
Object.defineProperty(exports, "translateSeriesName", { enumerable: true, get: function () { return chart_i18n_1.translateSeriesName; } });
Object.defineProperty(exports, "translateLegendNames", { enumerable: true, get: function () { return chart_i18n_1.translateLegendNames; } });
Object.defineProperty(exports, "translateTitle", { enumerable: true, get: function () { return chart_i18n_1.translateTitle; } });
Object.defineProperty(exports, "createTooltipFormatter", { enumerable: true, get: function () { return chart_i18n_1.createTooltipFormatter; } });
Object.defineProperty(exports, "createPieTooltipFormatter", { enumerable: true, get: function () { return chart_i18n_1.createPieTooltipFormatter; } });
Object.defineProperty(exports, "createGaugeFormatter", { enumerable: true, get: function () { return chart_i18n_1.createGaugeFormatter; } });
Object.defineProperty(exports, "translateAggregation", { enumerable: true, get: function () { return chart_i18n_1.translateAggregation; } });
Object.defineProperty(exports, "applyI18nToOption", { enumerable: true, get: function () { return chart_i18n_1.applyI18nToOption; } });
var locale_loader_1 = require("./i18n/locale-loader");
Object.defineProperty(exports, "initLocales", { enumerable: true, get: function () { return locale_loader_1.initLocales; } });
Object.defineProperty(exports, "detectBrowserLocale", { enumerable: true, get: function () { return locale_loader_1.detectBrowserLocale; } });
Object.defineProperty(exports, "getSupportedLocales", { enumerable: true, get: function () { return locale_loader_1.getSupportedLocales; } });
// 导出性能优化模块
var performance_1 = require("./performance");
// 抽样算法
Object.defineProperty(exports, "lttbSampling", { enumerable: true, get: function () { return performance_1.lttbSampling; } });
Object.defineProperty(exports, "averageSampling", { enumerable: true, get: function () { return performance_1.averageSampling; } });
Object.defineProperty(exports, "minMaxSampling", { enumerable: true, get: function () { return performance_1.minMaxSampling; } });
Object.defineProperty(exports, "randomSampling", { enumerable: true, get: function () { return performance_1.randomSampling; } });
Object.defineProperty(exports, "sampleData", { enumerable: true, get: function () { return performance_1.sampleData; } });
// 虚拟滚动
Object.defineProperty(exports, "getVirtualScrollRange", { enumerable: true, get: function () { return performance_1.getVirtualScrollRange; } });
// 数据聚合
Object.defineProperty(exports, "aggregateData", { enumerable: true, get: function () { return performance_1.aggregateData; } });
// 渐进渲染
Object.defineProperty(exports, "ProgressiveRenderer", { enumerable: true, get: function () { return performance_1.ProgressiveRenderer; } });
// 懒加载
Object.defineProperty(exports, "LazyDataLoader", { enumerable: true, get: function () { return performance_1.LazyDataLoader; } });
// 性能监控
Object.defineProperty(exports, "PerformanceMonitor", { enumerable: true, get: function () { return performance_1.PerformanceMonitor; } });
Object.defineProperty(exports, "optimizeData", { enumerable: true, get: function () { return performance_1.optimizeData; } });
// 渲染器集成
Object.defineProperty(exports, "parsePerformanceHints", { enumerable: true, get: function () { return performance_1.parsePerformanceHints; } });
Object.defineProperty(exports, "applyPerformanceOptimization", { enumerable: true, get: function () { return performance_1.applyPerformanceOptimization; } });
Object.defineProperty(exports, "generateProgressiveConfig", { enumerable: true, get: function () { return performance_1.generateProgressiveConfig; } });
Object.defineProperty(exports, "generateDataZoomConfig", { enumerable: true, get: function () { return performance_1.generateDataZoomConfig; } });
Object.defineProperty(exports, "generateOptimizedTooltip", { enumerable: true, get: function () { return performance_1.generateOptimizedTooltip; } });
Object.defineProperty(exports, "optimizeChartOption", { enumerable: true, get: function () { return performance_1.optimizeChartOption; } });
Object.defineProperty(exports, "createPerformanceStats", { enumerable: true, get: function () { return performance_1.createPerformanceStats; } });
Object.defineProperty(exports, "getOptimizationSuggestions", { enumerable: true, get: function () { return performance_1.getOptimizationSuggestions; } });
//# sourceMappingURL=index.js.map