/**
 * CDL 性能优化模块测试
 */

import {
  lttbSampling,
  averageSampling,
  minMaxSampling,
  randomSampling,
  sampleData,
  aggregateData,
  getVirtualScrollRange,
  ProgressiveRenderer,
  LazyDataLoader,
  PerformanceMonitor,
  optimizeData,
  applyPerformanceOptimization,
  parsePerformanceHints,
  generateProgressiveConfig,
  optimizeChartOption,
  getOptimizationSuggestions,
} from './index';

// 生成测试数据
function generateTimeSeriesData(count: number): Array<{ x: number; y: number; category: string }> {
  const data: Array<{ x: number; y: number; category: string }> = [];
  for (let i = 0; i < count; i++) {
    data.push({
      x: i,
      y: Math.sin(i / 100) * 100 + Math.random() * 20,
      category: i % 2 === 0 ? 'A' : 'B',
    });
  }
  return data;
}

// 测试 LTTB 抽样
function testLTTBSampling() {
  console.log('\n=== Test: LTTB Sampling ===');
  const data = generateTimeSeriesData(10000);
  const sampled = lttbSampling(data, 100, 'x', 'y');
  
  console.log(`Original: ${data.length}, Sampled: ${sampled.length}`);
  console.log(`Reduction ratio: ${(sampled.length / data.length * 100).toFixed(2)}%`);
  
  // 验证首尾点保留
  console.log(`First point preserved: ${sampled[0].x === data[0].x}`);
  console.log(`Last point preserved: ${sampled[sampled.length - 1].x === data[data.length - 1].x}`);
}

// 测试平均值抽样
function testAverageSampling() {
  console.log('\n=== Test: Average Sampling ===');
  const data = generateTimeSeriesData(1000);
  const sampled = averageSampling(data, 100, 'x', 'y');
  
  console.log(`Original: ${data.length}, Sampled: ${sampled.length}`);
  console.log(`Expected: ~${Math.ceil(data.length / 10)}`);
}

// 测试 Min-Max 抽样
function testMinMaxSampling() {
  console.log('\n=== Test: Min-Max Sampling ===');
  const data = generateTimeSeriesData(1000);
  const sampled = minMaxSampling(data, 100, 'x', 'y');
  
  console.log(`Original: ${data.length}, Sampled: ${sampled.length}`);
  
  // 验证数据排序
  let isSorted = true;
  for (let i = 1; i < sampled.length; i++) {
    if (sampled[i].x < sampled[i - 1].x) {
      isSorted = false;
      break;
    }
  }
  console.log(`Data sorted: ${isSorted}`);
}

// 测试数据聚合
function testAggregateData() {
  console.log('\n=== Test: Data Aggregation ===');
  const data = generateTimeSeriesData(1000);
  
  const aggregated = aggregateData(data, {
    method: 'avg',
    windowSize: 10,
    xField: 'x',
    yField: 'y',
  });
  
  console.log(`Original: ${data.length}, Aggregated: ${aggregated.length}`);
  console.log(`Reduction ratio: ${(aggregated.length / data.length * 100).toFixed(2)}%`);
}

// 测试虚拟滚动
function testVirtualScroll() {
  console.log('\n=== Test: Virtual Scroll ===');
  const totalCount = 10000;
  const viewportSize = 50;
  const bufferSize = 10;
  
  const ranges = [
    getVirtualScrollRange({ viewportSize, bufferSize, scrollOffset: 0, totalCount }),
    getVirtualScrollRange({ viewportSize, bufferSize, scrollOffset: 5000, totalCount }),
    getVirtualScrollRange({ viewportSize, bufferSize, scrollOffset: 9950, totalCount }),
  ];
  
  ranges.forEach((range, i) => {
    console.log(`Scroll ${i}: start=${range.start}, end=${range.end}, count=${range.visibleData.length}`);
  });
}

// 测试渐进渲染
async function testProgressiveRenderer() {
  console.log('\n=== Test: Progressive Renderer ===');
  const data = generateTimeSeriesData(1000);
  const renderer = new ProgressiveRenderer({
    enabled: true,
    frameSize: 100,
    frameInterval: 10,
  });
  
  const batches: number[] = [];
  
  await renderer.render(
    data,
    (batch: any[], progress: number) => {
      batches.push(batch.length);
      console.log(`Batch ${batches.length}: ${batch.length} items, progress: ${progress.toFixed(1)}%`);
    }
  );
  
  console.log(`Total batches: ${batches.length}`);
  console.log(`Total items: ${batches.reduce((a, b) => a + b, 0)}`);
}

// 测试懒加载
async function testLazyLoader() {
  console.log('\n=== Test: Lazy Data Loader ===');
  
  let fetchCount = 0;
  const loader = new LazyDataLoader(
    {
      batchSize: 100,
      loadedBatches: 0,
      preloadEnabled: true,
      preloadThreshold: 20,
    },
    async (batchIndex: number, batchSize: number) => {
      fetchCount++;
      const start = batchIndex * batchSize;
      return generateTimeSeriesData(batchSize).map((d, i) => ({
        ...d,
        x: start + i,
      }));
    }
  );
  
  const batch1 = await loader.loadBatch(0);
  console.log(`Batch 0: ${batch1.length} items`);
  
  const batch2 = await loader.loadBatch(1);
  console.log(`Batch 1: ${batch2.length} items`);
  
  // 测试缓存
  const batch1Cached = await loader.loadBatch(0);
  console.log(`Batch 0 (cached): ${batch1Cached.length} items`);
  console.log(`Fetch calls: ${fetchCount} (should be 2)`);
}

// 测试性能监控
function testPerformanceMonitor() {
  console.log('\n=== Test: Performance Monitor ===');
  const monitor = new PerformanceMonitor();
  
  monitor.mark('start');
  
  // 模拟一些工作
  for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
  }
  
  monitor.mark('mid');
  
  // 更多工作
  for (let i = 0; i < 1000000; i++) {
    Math.pow(i, 2);
  }
  
  monitor.mark('end');
  
  monitor.measure('first-phase', 'start', 'mid');
  monitor.measure('second-phase', 'mid', 'end');
  monitor.measure('total', 'start', 'end');
  
  console.log(monitor.report());
}

// 测试优化主入口
function testOptimizeData() {
  console.log('\n=== Test: optimizeData ===');
  const data = generateTimeSeriesData(10000);
  
  const result = optimizeData(data, {
    enableThreshold: 1000,
    sampling: {
      method: 'lttb',
      threshold: 500,
      xField: 'x',
      yField: 'y',
    },
  });
  
  console.log(`Original: ${data.length}`);
  console.log(`Optimized: ${result.data.length}`);
  console.log(`Sampling ratio: ${(result.samplingRatio * 100).toFixed(2)}%`);
  console.log(`Recommendations: ${result.recommendations.join(', ')}`);
}

// 测试 hints 解析
function testParsePerformanceHints() {
  console.log('\n=== Test: parsePerformanceHints ===');
  
  const testCases = [
    { performance: 'true', sampling: 'lttb', maxPoints: '1000' },
    { performance: 'auto', threshold: '5000', progressive: 'true', progressiveChunk: '500' },
    { aggregation: 'avg', aggregationWindow: '10' },
  ];
  
  testCases.forEach((hints, i) => {
    const parsed = parsePerformanceHints(hints);
    console.log(`Case ${i}:`, JSON.stringify(parsed, null, 2));
  });
}

// 测试 ECharts 配置生成
function testGenerateEChartsConfig() {
  console.log('\n=== Test: generateEChartsConfig ===');
  
  const hints1 = { progressive: true, progressiveChunk: 500 };
  const config1 = generateProgressiveConfig(hints1, 10000);
  console.log('Large dataset:', JSON.stringify(config1));
  
  const hints2 = { progressive: true };
  const config2 = generateProgressiveConfig(hints2, 100);
  console.log('Small dataset:', JSON.stringify(config2));
}

// 测试优化建议
function testOptimizationSuggestions() {
  console.log('\n=== Test: getOptimizationSuggestions ===');
  
  const suggestions1 = getOptimizationSuggestions(150000, 'line');
  console.log('150k points:', suggestions1);
  
  const suggestions2 = getOptimizationSuggestions(15000, 'scatter');
  console.log('15k scatter:', suggestions2);
  
  const suggestions3 = getOptimizationSuggestions(500, 'line');
  console.log('500 points:', suggestions3);
}

// 测试完整优化流程
function testFullOptimization() {
  console.log('\n=== Test: Full Optimization Flow ===');
  const data = generateTimeSeriesData(50000);
  
  const result = applyPerformanceOptimization(
    data,
    {
      enabled: true,
      sampling: 'lttb',
      maxPoints: 2000,
    },
    'x',
    'y'
  );
  
  console.log('Optimization Info:');
  console.log(`  Original count: ${result.optimizationInfo.originalCount.toLocaleString()}`);
  console.log(`  Optimized count: ${result.optimizationInfo.optimizedCount.toLocaleString()}`);
  console.log(`  Sampling ratio: ${(result.optimizationInfo.samplingRatio * 100).toFixed(2)}%`);
  console.log(`  Methods: ${result.optimizationInfo.methods.join(', ')}`);
  console.log(`  Is optimized: ${result.isOptimized}`);
}

// 运行所有测试
async function runAllTests() {
  console.log('=======================================');
  console.log('CDL Performance Optimization Tests');
  console.log('=======================================');
  
  testLTTBSampling();
  testAverageSampling();
  testMinMaxSampling();
  testAggregateData();
  testVirtualScroll();
  await testProgressiveRenderer();
  await testLazyLoader();
  testPerformanceMonitor();
  testOptimizeData();
  testParsePerformanceHints();
  testGenerateEChartsConfig();
  testOptimizationSuggestions();
  testFullOptimization();
  
  console.log('\n=======================================');
  console.log('All tests completed!');
  console.log('=======================================');
}

// 导出测试函数供外部使用
export {
  runAllTests,
  testLTTBSampling,
  testAverageSampling,
  testMinMaxSampling,
  testAggregateData,
  testVirtualScroll,
  testProgressiveRenderer,
  testLazyLoader,
  testPerformanceMonitor,
  testOptimizeData,
  testParsePerformanceHints,
  testGenerateEChartsConfig,
  testOptimizationSuggestions,
  testFullOptimization,
};

// 如果是直接运行此文件
if (typeof (globalThis as any).window === 'undefined') {
  runAllTests().catch(console.error);
}
