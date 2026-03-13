import { render, CDLFile } from './index.js';

// Test case 1: Line chart
const lineChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'sales',
    lang: 'data',
    config: {},
    query: 'month,revenue\nJan,100\nFeb,150\nMar,200\nApr,180\nMay,220',
  }],
  charts: [{
    type: 'chart',
    chartType: 'line',
    dataSources: ['sales'],
    x: 'month',
    y: 'revenue',
    hints: {
      title: 'Monthly Revenue',
      style: '平滑',
    },
  }],
};

console.log('=== Test 1: Line Chart ===');
const lineResult = render(lineChartCDL);
if (lineResult.success) {
  console.log('✅ Line chart rendered successfully');
  console.log('Scales:', Object.keys(lineResult.spec!.scales));
  console.log('Axes:', lineResult.spec!.axes.length);
  console.log('Series:', lineResult.spec!.series.length);
} else {
  console.log('❌ Failed:', lineResult.error);
}

// Test case 2: Bar chart
const barChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'products',
    lang: 'data',
    config: {},
    query: 'product,sales\nA,120\nB,200\nC,150\nD,180',
  }],
  charts: [{
    type: 'chart',
    chartType: 'bar',
    dataSources: ['products'],
    x: 'product',
    y: 'sales',
    hints: {
      title: 'Product Sales',
      color: '#4e79a7,#f28e2c',
    },
  }],
};

console.log('\n=== Test 2: Bar Chart ===');
const barResult = render(barChartCDL);
if (barResult.success) {
  console.log('✅ Bar chart rendered successfully');
  console.log('Data points:', barResult.spec!.data.length);
} else {
  console.log('❌ Failed:', barResult.error);
}

// Test case 3: Pie chart
const pieChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'market',
    lang: 'data',
    config: {},
    query: 'segment,share\nNorth,35\nSouth,25\nEast,20\nWest,20',
  }],
  charts: [{
    type: 'chart',
    chartType: 'pie',
    dataSources: ['market'],
    x: 'segment',
    y: 'share',
    hints: {
      title: 'Market Share',
      style: '环形',
    },
  }],
};

console.log('\n=== Test 3: Pie Chart ===');
const pieResult = render(pieChartCDL);
if (pieResult.success) {
  console.log('✅ Pie chart rendered successfully');
  console.log('Has percentage data:', pieResult.spec!.data[0].hasOwnProperty('_percentage'));
} else {
  console.log('❌ Failed:', pieResult.error);
}

// Test case 4: Scatter chart
const scatterChartCDL: CDLFile = {
  data: [{
    type: 'data',
    name: 'correlation',
    lang: 'data',
    config: {},
    query: 'x,y\n1,2\n2,3\n3,5\n4,4\n5,7\n6,6',
  }],
  charts: [{
    type: 'chart',
    chartType: 'scatter',
    dataSources: ['correlation'],
    x: 'x',
    y: 'y',
    hints: {
      title: 'Correlation',
    },
  }],
};

console.log('\n=== Test 4: Scatter Chart ===');
const scatterResult = render(scatterChartCDL);
if (scatterResult.success) {
  console.log('✅ Scatter chart rendered successfully');
  console.log('X scale type:', scatterResult.spec!.scales.x?.type);
} else {
  console.log('❌ Failed:', scatterResult.error);
}

// Test case 5: Theme support
console.log('\n=== Test 5: Theme Support ===');
const darkResult = render(lineChartCDL, 'dark');
if (darkResult.success) {
  console.log('✅ Dark theme applied');
  console.log('Color scheme:', darkResult.spec!.colorScheme?.slice(0, 3));
}

console.log('\n=== All tests completed ===');
