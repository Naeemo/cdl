// CDL ECharts Renderer Test
// 测试 v0.6 新特性

import { render } from './renderer-v06';

console.log('=== CDL ECharts Renderer v0.6 Test ===\n');

// Test 1: Combo Chart with series & axis & interaction
console.log('1. Testing Combo Chart (v0.6 features)...');
const comboCDL = {
  data: [{
    type: 'data',
    name: 'SalesAndProfit_data',
    lang: 'data',
    config: {},
    query: '月份,销售额,利润\n1月,120,15\n2月,150,20\n3月,180,25',
  }],
  charts: [{
    type: 'chart',
    name: '销售额与利润分析',
    chartType: 'combo',
    dataSources: ['SalesAndProfit_data'],
    hints: { color: '#4fc3f7' },
    series: [
      { field: '销售额', as: '销售额(万元)', type: 'bar', color: '#4fc3f7', axis: 'left', style: 'solid' },
      { field: '利润', as: '利润(万元)', type: 'line', color: '#ff9800', axis: 'right', style: 'smooth' }
    ],
    axis: [
      { position: 'x', labelRotate: 45 },
      { position: 'y', min: 0, max: 200, labelFormatter: '${value}万', splitLine: true },
      { position: 'y2', min: 0, max: 50, labelFormatter: '${value}%' }
    ],
    interaction: { tooltip: 'shared', zoom: 'inside' },
  }],
};

const comboResult = render(comboCDL);
if (comboResult.success) {
  console.log('✓ Combo Chart');
  console.log('  Series count:', comboResult.option?.series?.length);
  console.log('  YAxis count:', comboResult.option?.yAxis?.length);
  console.log('  Has dataZoom:', !!comboResult.option?.dataZoom);
} else {
  console.error('✗ Combo Chart:', comboResult.error);
}

// Test 2: Simple Line Chart (backward compatibility)
console.log('\n2. Testing Line Chart (simple)...');
const lineCDL = {
  data: [{
    type: 'data',
    name: 'SalesData',
    lang: 'data',
    config: {},
    query: 'month,sales\n1月,100\n2月,150\n3月,200',
  }],
  charts: [{
    type: 'chart',
    name: '月度销售',
    chartType: 'line',
    dataSources: ['SalesData'],
    x: 'month',
    y: 'sales',
    hints: { title: '月度销售趋势', style: '平滑曲线', color: '#4fc3f7' },
  }],
};

const lineResult = render(lineCDL);
if (lineResult.success) {
  console.log('✓ Line Chart');
  console.log('  Type:', lineResult.option?.series?.[0]?.type);
  console.log('  Smooth:', lineResult.option?.series?.[0]?.smooth);
} else {
  console.error('✗ Line Chart:', lineResult.error);
}

// Test 3: Bar Chart with stacking
console.log('\n3. Testing Bar Chart (stacked)...');
const barCDL = {
  data: [{
    type: 'data',
    name: 'StackData',
    lang: 'data',
    config: {},
    query: 'month,online,offline\n1月,60,40\n2月,80,50\n3月,100,60',
  }],
  charts: [{
    type: 'chart',
    chartType: 'bar',
    dataSources: ['StackData'],
    x: 'month',
    stack: true,
    hints: { title: '渠道销量' },
  }],
};

const barResult = render(barCDL);
if (barResult.success) {
  console.log('✓ Bar Chart');
  console.log('  Stack:', barResult.option?.series?.[0]?.stack);
} else {
  console.error('✗ Bar Chart:', barResult.error);
}

// Full option output
console.log('\n=== Full ECharts Option (Combo Chart) ===');
console.log(JSON.stringify(comboResult.option, null, 2));

console.log('\n=== All Tests Complete ===');