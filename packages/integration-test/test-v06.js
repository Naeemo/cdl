#!/usr/bin/env node
// CDL v0.6 End-to-End Integration Test (Standalone)

const path = require('path');
const { compile } = require(path.resolve(__dirname, '../compiler/dist/compiler.js'));
const { render } = require(path.resolve(__dirname, '../renderer/dist/index.js'));

console.log('=== CDL v0.6 End-to-End Test ===\n');

// Test case: Combo chart with all v0.6 features
const cdlSource = `
# 销售额与利润分析

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |
| 3月 | 180 | 25 |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left | solid |
| 利润 | 利润(万元) | line | #ff9800 | right | smooth |

## axis x
labelRotate: 45

## axis y
min: 0
max: 200

## axis y2
min: 0
max: 50

@interaction "tooltip:shared zoom:inside"
@color "#4fc3f7"
`;

console.log('1. Compiling CDL...');
const compileResult = compile(cdlSource);

if (compileResult.errors.length > 0) {
  console.error('❌ Compilation failed:');
  compileResult.errors.forEach(e => {
    console.error(`   Line ${e.line}: ${e.message}`);
  });
  process.exit(1);
}

console.log('✓ Compilation succeeded');
const ast = compileResult.file;
console.log(`  - Data sources: ${ast.data.length}`);
console.log(`  - Charts: ${ast.charts.length}`);

console.log('\nAST Summary:');
console.log(`  Chart name: ${ast.charts[0].name}`);
console.log(`  Chart type: ${ast.charts[0].chartType}`);
console.log(`  Series count: ${ast.charts[0].series?.length || 0}`);
console.log(`  Axis count: ${ast.charts[0].axis?.length || 0}`);
console.log(`  Interaction: ${ast.charts[0].interaction ? 'configured' : 'none'}`);

console.log('\n2. Rendering to ECharts option...');
const renderResult = render(ast);

if (!renderResult.success) {
  console.error('❌ Rendering failed:', renderResult.error);
  process.exit(1);
}

console.log('✓ Rendering succeeded');
const option = renderResult.option;

console.log('\nECharts Option Summary:');
console.log(`  Title: ${option.title?.text || 'none'}`);
console.log(`  XAxis count: ${Array.isArray(option.xAxis) ? option.xAxis.length : 1}`);
console.log(`  YAxis count: ${Array.isArray(option.yAxis) ? option.yAxis.length : 1}`);
console.log(`  Series count: ${option.series?.length || 0}`);
console.log(`  DataZoom: ${option.dataZoom?.length > 0 ? 'enabled' : 'disabled'}`);
console.log(`  Colors: ${option.color?.join(', ') || 'default'}`);

// Validate combo-specific features
console.log('\n3. Validating v0.6 features...');

const chart = ast.charts[0];
let passed = 0;
let total = 4;

// Feature 1: series table parsed
if (chart.series && chart.series.length === 2) {
  console.log('  ✓ series table parsed (2 series)');
  passed++;
} else {
  console.log('  ✗ series table not parsed correctly');
}

// Feature 2: axis blocks parsed
if (chart.axis && chart.axis.length === 3) {
  console.log('  ✓ axis blocks parsed (3 axes: x, y, y2)');
  passed++;
} else {
  console.log(`  ✗ axis blocks not parsed correctly (expected 3, got ${chart.axis?.length || 0})`);
}

// Feature 3: interaction config
if (chart.interaction && chart.interaction.tooltip === 'shared' && chart.interaction.zoom === 'inside') {
  console.log('  ✓ interaction configured (tooltip: shared, zoom: inside)');
  passed++;
} else {
  console.log('  ✗ interaction not configured correctly');
}

// Feature 4: ECharts option mapping
const hasDualYAxis = Array.isArray(option.yAxis) && option.yAxis.length === 2;
const hasDataZoom = option.dataZoom && option.dataZoom.length > 0;
const seriesCount = option.series?.length === 2;
if (hasDualYAxis && hasDataZoom && seriesCount) {
  console.log('  ✓ ECharts option mapping correct (dual Y, dataZoom, 2 series)');
  passed++;
} else {
  console.log('  ✗ ECharts option mapping incorrect');
}

console.log(`\n=== Test Result: ${passed}/${total} features passed ===`);

if (passed === total) {
  console.log('\n🎉 All v0.6 features working correctly!');
  process.exit(0);
} else {
  console.log('\n❌ Some features failed');
  process.exit(1);
}