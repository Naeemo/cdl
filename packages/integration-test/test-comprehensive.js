#!/usr/bin/env node
// CDL v0.6 Comprehensive Tests

const path = require('path');
const { compile } = require(path.resolve(__dirname, '../compiler/dist/compiler.js'));
const { render } = require(path.resolve(__dirname, '../renderer/dist/index.js'));

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); passed++; }
  catch (e) { console.error(`✗ ${name}: ${e.message}`); failed++; }
}

function assert(c, m) { if (!c) throw new Error(m || 'fail'); }

console.log('=== CDL v0.6 Comprehensive Test Suite ===\n');

// Helper: create source with proper markdown table
function md(title, headers, rowsArr, ...blocks) {
  let src = `# ${title}\n\n`;
  src += `| ${headers.join(' | ')} |\n`;
  src += `| ${headers.map(() => '---').join(' | ')} |\n`;
  for (const row of rowsArr) {
    src += `| ${row.join(' | ')} |\n`;
  }
  src += '\n';
  for (const b of blocks) src += b + '\n';
  return src;
}

// 1. Combo chart
test('Combo chart', () => {
  const src = md('销售', ['月份', '销量', '利润'],
    ['1月', '120', '15'],
    ['2月', '150', '20'],
    '## combo',
    '## series',
    '| field | as | type | axis |',
    '| --- | --- | --- | --- |',
    '| 销量 | 销量 | bar | left |',
    '| 利润 | 利润 | line | right |',
    '## axis y2',
    'min: 0'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].series?.length === 2);
  const opt = render(ast).option;
  assert(opt.series[1].yAxisIndex === 1);
});

// 2. Series preserves case
test('Series preserves case', () => {
  const src = md('数据', ['x', 'a', 'b'],
    ['A', '10', '20'],
    '## combo',
    '## series',
    '| field | as | type | axis |',
    '| --- | --- | --- | --- |',
    '| a | A系列 | bar | left |'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].series[0].as === 'A系列');
});

// 3. Multiple axis blocks
test('Multiple axis blocks', () => {
  const src = md('测试', ['月份', '销量'],
    ['1月', '100'],
    '## line',
    '## axis x',
    'labelRotate: 45',
    '## axis y',
    'min: 0',
    'max: 300',
    '## axis y2',
    'min: 0'
  );
  const ast = compile(src).file;
  const ax = ast.charts[0].axis;
  assert(ax.length === 3);
  assert(ax[1].max === 300);
});

// 4. Interaction connect
test('Interaction connect', () => {
  const src = md('测试', ['时间', '值'],
    ['1h', '10'],
    '## line',
    '@interaction "tooltip:shared zoom:inside brush:{connect:[\'c2\']}"'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].interaction.brush?.connect?.[0] === 'c2');
});

// 5. Simple line chart
test('Simple line chart', () => {
  const src = md('趋势', ['月份', '销量'],
    ['1月', '100'],
    '## line'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].chartType === 'line');
});

// 6. Auto group (3 cols)
test('Auto group (3 columns)', () => {
  const src = md('数据', ['月份', '渠道', '销量'],
    ['1月', '线上', '60'],
    '## bar'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].group === '销量');
});

// 7. Stacked bar
test('Stacked bar', () => {
  const src = md('堆叠', ['月份', '线上', '线下'],
    ['1月', '60', '40'],
    '## bar',
    '@stack true'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].stack === true);
  const opt = render(ast).option;
  assert(opt.series[0].stack === 'total');
});

// 8. Pie ring style
test('Pie ring style', () => {
  const src = md('占比', ['类别', '值'],
    ['A', '30'],
    '## pie',
    '@style "donut"'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].chartType === 'pie');
  const opt = render(ast).option;
  assert(opt.series[0].radius[0] === '40%');
});

// 9. Error missing table
test('Error: missing table', () => {
  const r = compile('# title\n\n## line');
  assert(!r.success && r.errors.length > 0);
});

// 10. Empty series fallback
test('Empty series fallback', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '10'],
    '## bar'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].x === 'x');
});

// 11. Empty axis block
test('Empty axis block', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '10'],
    '## line',
    '## axis x'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].axis?.[0].position === 'x');
});

// 12. Interaction multiple options
test('Interaction multiple options', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '10'],
    '## line',
    '@interaction "tooltip:single zoom:slider brush:true"'
  );
  const i = compile(src).file.charts[0].interaction;
  assert(i.tooltip === 'single' && i.zoom === 'slider' && i.brush === true);
});

// 13. Hints preserved
test('Hints preserved', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '10'],
    '## line',
    '## axis x',
    'labelRotate: 45',
    '@color "#f00"',
    '## axis y',
    'min: 0'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].hints.color === '#f00');
});

// 14. Multiple charts
test('Multiple charts', () => {
  const src = `# C1\n\n| x | y |\n| --- | --- |\n| A | 10 |\n\n## line\n\n---\n\n# C2\n\n| x | y |\n| --- | --- |\n| B | 20 |\n\n## bar`;
  const ast = compile(src).file;
  assert(ast.charts.length === 2);
});

// 15. Combo series override
test('Combo series override', () => {
  const src = md('销售', ['月份', '线上', '利润'],
    ['1月', '60', '15'],
    '## combo',
    '## series',
    '| field | as | type | axis |',
    '| --- | --- | --- | --- |',
    '| 线上 | 线上 | bar | left |',
    '| 利润 | 利润 | line | right |'
  );
  const ast = compile(src).file;
  assert(ast.charts[0].series?.[1].axis === 'right');
  const opt = render(ast).option;
  assert(opt.series[1].yAxisIndex === 1);
});

// 16. Interaction JSON objects
test('Interaction JSON', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '10'],
    '## line',
    '@interaction "tooltip:shared zoom:{type:inside} brush:{link:{x:[\'c2\']}}"'
  );
  const i = compile(src).file.charts[0].interaction;
  assert(i.tooltip === 'shared');
  assert(i.brush?.link?.x?.[0] === 'c2');
});

// 17. Axis labelFormatter
test('Axis labelFormatter', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '100'],
    '## line',
    '## axis y',
    'labelFormatter: "${value}万"'
  );
  const axis = compile(src).file.charts[0].axis?.find(a => a.position === 'y');
  assert(axis?.labelFormatter === '${value}万');
});

// 18. Axis positions
test('Axis positions', () => {
  const src = md('测试', ['x', 'y'],
    ['A', '10'],
    '## line',
    '## axis x',
    '## axis y',
    '## axis y2',
    '## axis top',
    '## axis right'
  );
  const pos = compile(src).file.charts[0].axis?.map(a => a.position) || [];
  assert(pos.includes('x') && pos.includes('y') && pos.includes('y2') && pos.includes('x2'));
});

console.log(`\n=== Results: ${passed}/${passed+failed} passed ===`);
process.exit(failed === 0 ? 0 : 1);