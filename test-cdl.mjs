#!/usr/bin/env node

// Quick test script for CDL core functionality
import { compile } from './packages/compiler/dist/compiler.js';
import { render } from './packages/renderer/dist/index.js';

const testCDL = `
Chart Sales {
  use SalesData
  type bar
  x month
  y revenue
}
`;

console.log('Testing CDL compilation...');
const result = compile(testCDL);

if (result.success) {
  console.log('✅ Compilation successful!');
  console.log('AST:', JSON.stringify(result.result, null, 2));

  console.log('\nTesting ECharts rendering...');
  const echartsOption = render(result.result);
  console.log('✅ Rendering successful!');
  console.log('ECharts option keys:', Object.keys(echartsOption));
  console.log('\nGenerated option:', JSON.stringify(echartsOption, null, 2));
} else {
  console.error('❌ Compilation failed:', result.errors);
  process.exit(1);
}