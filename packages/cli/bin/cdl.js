#!/usr/bin/env node

const { compile } = require('@cdl/compiler');
const { render } = require('@cdl/renderer-echarts');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
CDL CLI - Chart Definition Language Command Line Tool

Usage:
  cdl <command> [options]

Commands:
  compile <file.cdl>     Compile CDL to AST JSON
  render <file.cdl>      Render CDL to ECharts option JSON
  validate <file.cdl>    Validate CDL syntax
  init                   Create a sample CDL file
  help                   Show this help message

Examples:
  cdl compile example.cdl > output.json
  cdl render example.cdl > echarts.json
  cdl validate example.cdl
`);
}

function compileFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const result = compile(source);

  if (result.success) {
    console.log(JSON.stringify(result.result, null, 2));
  } else {
    console.error('Compilation errors:');
    result.errors.forEach(e => {
      console.error(`  Line ${e.line}, Col ${e.column}: ${e.message}`);
    });
    process.exit(1);
  }
}

function renderFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const compileResult = compile(source);

  if (!compileResult.success) {
    console.error('Compilation errors:');
    compileResult.errors.forEach(e => {
      console.error(`  Line ${e.line}, Col ${e.column}: ${e.message}`);
    });
    process.exit(1);
  }

  const renderResult = render(compileResult.result);

  if (renderResult.success) {
    console.log(JSON.stringify(renderResult.option, null, 2));
  } else {
    console.error(`Render error: ${renderResult.error}`);
    process.exit(1);
  }
}

function validateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const result = compile(source);

  if (result.success) {
    console.log('✓ Valid CDL file');
    console.log(`  Data sources: ${result.result.data.length}`);
    console.log(`  Charts: ${result.result.charts.length}`);
  } else {
    console.log('✗ Invalid CDL file');
    result.errors.forEach(e => {
      console.error(`  Line ${e.line}, Col ${e.column}: ${e.message}`);
    });
    process.exit(1);
  }
}

function initSample() {
  const sample = `@lang(data)
SalesData {
    month,amount
    1月,100
    2月,150
    3月,200
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y amount
    @style "平滑曲线"
    @title "月度销售趋势"
}`;

  fs.writeFileSync('example.cdl', sample);
  console.log('Created example.cdl');
}

switch (command) {
  case 'compile':
    compileFile(args[1]);
    break;
  case 'render':
    renderFile(args[1]);
    break;
  case 'validate':
    validateFile(args[1]);
    break;
  case 'init':
    initSample();
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
