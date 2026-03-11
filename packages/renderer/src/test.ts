import { render, CDLFile } from './index';

console.log('=== CDL ECharts Renderer Test ===\n');

// Test 1: Line Chart
console.log('1. Testing Line Chart...');
const lineChartCDL: CDLFile = {
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
    hints: {
      title: '月度销售趋势',
      style: '平滑曲线',
      color: '#4fc3f7',
    },
  }],
};

const lineResult = render(lineChartCDL);
if (lineResult.success) {
  console.log('✓ Line Chart');
  console.log('  Type:', lineResult.option?.series?.[0]?.type);
  console.log('  Smooth:', lineResult.option?.series?.[0]?.smooth);
  console.log('  Title:', lineResult.option?.title?.text);
} else {
  console.error('✗ Line Chart:', lineResult.error);
}

// Test 2: Bar Chart
console.log('\n2. Testing Bar Chart...');
const barChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'RegionData',
    lang: 'data',
    config: {},
    query: 'region,sales\n华北,100\n华南,200',
  }],
  charts: [{
    type: 'chart',
    chartType: 'bar',
    dataSources: ['RegionData'],
    x: 'region',
    y: 'sales',
    hints: {
      title: '区域销售',
    },
  }],
};

const barResult = render(barChartCDL);
if (barResult.success) {
  console.log('✓ Bar Chart');
  console.log('  Type:', barResult.option?.series?.[0]?.type);
} else {
  console.error('✗ Bar Chart:', barResult.error);
}

// Test 3: Pie Chart with ring style
console.log('\n3. Testing Pie Chart (Ring)...');
const pieChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'CategoryData',
    lang: 'data',
    config: {},
    query: 'category,value\nA,30\nB,70',
  }],
  charts: [{
    type: 'chart',
    chartType: 'pie',
    dataSources: ['CategoryData'],
    hints: {
      title: '品类占比',
      style: '环形',
    },
  }],
};

const pieResult = render(pieChartCDL);
if (pieResult.success) {
  console.log('✓ Pie Chart');
  console.log('  Type:', pieResult.option?.series?.[0]?.type);
  console.log('  Radius:', pieResult.option?.series?.[0]?.radius);
} else {
  console.error('✗ Pie Chart:', pieResult.error);
}

// Test 4: Area Chart
console.log('\n4. Testing Area Chart...');
const areaChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'GrowthData',
    lang: 'data',
    config: {},
    query: 'month,users\n1月,100\n2月,150\n3月,200',
  }],
  charts: [{
    type: 'chart',
    chartType: 'area',
    dataSources: ['GrowthData'],
    x: 'month',
    y: 'users',
    hints: {
      title: '用户增长',
      style: '平滑',
    },
  }],
};

const areaResult = render(areaChartCDL);
if (areaResult.success) {
  console.log('✓ Area Chart');
  console.log('  Type:', areaResult.option?.series?.[0]?.type);
  console.log('  Has AreaStyle:', !!areaResult.option?.series?.[0]?.areaStyle);
} else {
  console.error('✗ Area Chart:', areaResult.error);
}

// Test 5: Scatter Chart
console.log('\n5. Testing Scatter Chart...');
const scatterChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'PriceData',
    lang: 'data',
    config: {},
    query: 'price,sales\n10,100\n20,80\n30,60',
  }],
  charts: [{
    type: 'chart',
    chartType: 'scatter',
    dataSources: ['PriceData'],
    x: 'price',
    y: 'sales',
    hints: {
      title: '价格销量关系',
    },
  }],
};

const scatterResult = render(scatterChartCDL);
if (scatterResult.success) {
  console.log('✓ Scatter Chart');
  console.log('  Type:', scatterResult.option?.series?.[0]?.type);
} else {
  console.error('✗ Scatter Chart:', scatterResult.error);
}

// Test 6: Radar Chart
console.log('\n6. Testing Radar Chart...');
const radarChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'SkillData',
    lang: 'data',
    config: {},
    query: 'skill,score\n技术,90\n沟通,80\n管理,70',
  }],
  charts: [{
    type: 'chart',
    chartType: 'radar',
    dataSources: ['SkillData'],
    hints: {
      title: '技能评估',
    },
  }],
};

const radarResult = render(radarChartCDL);
if (radarResult.success) {
  console.log('✓ Radar Chart');
  console.log('  Type:', radarResult.option?.series?.[0]?.type);
  console.log('  Has Radar:', !!radarResult.option?.radar);
} else {
  console.error('✗ Radar Chart:', radarResult.error);
}

// Full ECharts Option Output
console.log('\n=== Full ECharts Option (Line Chart) ===');
console.log(JSON.stringify(lineResult.option, null, 2));

console.log('\n=== All Tests Complete ===');
