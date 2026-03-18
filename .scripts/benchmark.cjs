#!/usr/bin/env node
/**
 * CDL Performance Benchmark
 * 测量编译和渲染性能，目标: <100ms for typical charts
 */

const path = require('path');
const { compile } = require(path.join(__dirname, '..', 'packages/compiler/dist/compiler.js'));
const { render } = require(path.join(__dirname, '..', 'packages/renderer/dist/index.js'));

// 代表性 CDL 示例（不同复杂度）
const testCases = [
  {
    name: 'Simple line chart',
    cdl: `@lang(data)
Data { month,amount 1月,100 2月,150 3月,200 }
Chart { use Data type line x month y amount }`
  },
  {
    name: 'Bar with series',
    cdl: `@lang(data)
Data { month,sales,profit 1月,100,15 2月,150,20 3月,200,25 }
Chart { use Data type combo
  ## series
  | field | as | type |
  | --- | --- | --- |
  | sales | 销售额 | bar |
  | profit | 利润 | line |
}`
  },
  {
    name: 'Complex with transforms',
    cdl: `@lang(data)
@transform "filter(amount > 100) | sort(amount desc) | limit(10)"
Data { month,amount,category 1月,100,A 2月,150,B 3月,80,A 4月,200,B }
Chart { use Data type bar x month y amount @color "category=blue,other=gray" }`
  },
  {
    name: 'Medium dataset (50 rows)',
    cdl: generateDataCDL(50)
  },
  {
    name: 'Large dataset (500 rows)',
    cdl: generateDataCDL(500)
  }
];

function generateDataCDL(rows) {
  let data = '@lang(data)\nData { month,amount\n';
  for (let i = 1; i <= rows; i++) {
    data += `${i}月,${Math.floor(Math.random() * 200 + 50)}\n`;
  }
  data += '}\n\nChart { use Data type line x month y amount }';
  return data;
}

async function runBenchmark(iterations = 100) {
  console.log('=== CDL Performance Benchmark ===\n');
  
  for (const test of testCases) {
    console.log(`\n📊 ${test.name}`);
    console.log(`  CDL size: ${test.cdl.length} chars`);
    
    // Warm-up
    compile(test.cdl);
    
    // Measure compile
    const compileTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const result = compile(test.cdl);
      const end = process.hrtime.bigint();
      compileTimes.push(Number(end - start) / 1e6); // ms
    }
    
    const avgCompile = compileTimes.reduce((a, b) => a + b) / compileTimes.length;
    const maxCompile = Math.max(...compileTimes);
    const minCompile = Math.min(...compileTimes);
    
    console.log(`  Compile (${iterations} runs):`);
    console.log(`    Avg: ${avgCompile.toFixed(2)}ms`);
    console.log(`    Min: ${minCompile.toFixed(2)}ms`);
    console.log(`    Max: ${maxCompile.toFixed(2)}ms`);
    
    // Measure render (only if compile succeeded)
    if (test.name !== 'Medium dataset (50 rows)' && test.name !== 'Large dataset (500 rows)') {
      const compileResult = compile(test.cdl);
      if (compileResult.errors.length === 0) {
        const renderTimes = [];
        for (let i = 0; i < iterations; i++) {
          const start = process.hrtime.bigint();
          render(compileResult.file);
          const end = process.hrtime.bigint();
          renderTimes.push(Number(end - start) / 1e6);
        }
        const avgRender = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
        console.log(`  Render (${iterations} runs): Avg ${avgRender.toFixed(2)}ms`);
      }
    }
    
    // Assessment
    if (avgCompile < 10) {
      console.log('  ✅ Excellent (< 10ms)');
    } else if (avgCompile < 50) {
      console.log('  ✅ Good (< 50ms)');
    } else if (avgCompile < 100) {
      console.log('  ⚠️  Acceptable (< 100ms)');
    } else {
      console.log('  ❌ Needs optimization (> 100ms)');
    }
  }
  
  console.log('\n=== Benchmark Complete ===');
}

runBenchmark().catch(console.error);