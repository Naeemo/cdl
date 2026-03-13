#!/usr/bin/env node

const { compile } = require('@cdl/compiler');
const { render } = require('@cdl/renderer-echarts');
const fs = require('fs');
const path = require('path');
const http = require('http');

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
  export <file.cdl>      Export chart to PNG/SVG/PDF
  validate <file.cdl>    Validate CDL syntax
  init                   Create a sample CDL file
  nl "<description>"     Generate CDL from natural language
  help                   Show this help message

Export Command Options:
  cdl export example.cdl --format png --output chart.png
  cdl export example.cdl --format svg --output chart.svg

NL Command Options:
  cdl nl "show sales trend" --api-key <key>
  cdl nl "pie chart of budget" --output output.cdl

Examples:
  cdl compile example.cdl > output.json
  cdl render example.cdl > echarts.json
  cdl validate example.cdl
  cdl nl "line chart of monthly sales, blue color" --api-key $KIMI_API_KEY
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

async function exportFile(args) {
  const filePath = args[1];
  if (!filePath) {
    console.error('Error: Please provide a CDL file');
    console.log('Usage: cdl export <file.cdl> --format <png|svg> --output <file>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Parse options
  let format = 'png';
  let outputFile = 'chart.png';

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    }
  }

  if (!['png', 'svg'].includes(format)) {
    console.error('Error: Format must be png or svg');
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

  if (!renderResult.success) {
    console.error(`Render error: ${renderResult.error}`);
    process.exit(1);
  }

  // Generate HTML with ECharts
  const html = generateChartHTML(renderResult.option, format);

  // Use puppeteer or similar to render - for now, save HTML
  const tempHtmlFile = outputFile.replace(/\.[^.]+$/, '.html');
  fs.writeFileSync(tempHtmlFile, html);

  console.log(`✓ Chart HTML saved to: ${tempHtmlFile}`);
  console.log('  Open this file in browser and save as image manually');
  console.log('  (Headless browser support coming in next update)');
}

function generateChartHTML(option, format) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CDL Export</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; }
    #chart { width: 800px; height: 600px; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption(${JSON.stringify(option)});
    
    // Auto-download for PNG/SVG
    setTimeout(() => {
      const url = chart.getDataURL({
        type: '${format}',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      const link = document.createElement('a');
      link.download = 'chart.${format}';
      link.href = url;
      link.click();
    }, 500);
  </script>
</body>
</html>`;
}

async function nlCommand(args) {
  const description = args[1];
  if (!description) {
    console.error('Error: Please provide a description');
    console.log('Usage: cdl nl "<description>" --api-key <key>');
    process.exit(1);
  }

  // Parse options
  let apiKey = process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY;
  let outputFile = null;
  let model = 'kimi-k2p5';

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--model' && args[i + 1]) {
      model = args[i + 1];
      i++;
    }
  }

  if (!apiKey) {
    console.error('Error: API key required. Set KIMI_API_KEY env var or use --api-key');
    process.exit(1);
  }

  console.log('Generating CDL from natural language...');
  console.log(`Description: ${description}`);

  try {
    // Dynamic import for ESM module
    const { nlToCDL } = await import('@cdl/nl-codegen');
    const result = await nlToCDL(description, {
      apiKey,
      model,
    });

    if (result.success) {
      if (outputFile) {
        fs.writeFileSync(outputFile, result.cdl);
        console.log(`✓ Generated CDL saved to: ${outputFile}`);
      } else {
        console.log('\n--- Generated CDL ---\n');
        console.log(result.cdl);
        console.log('\n--- End ---');
      }
    } else {
      console.error(`✗ Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
}

switch (command) {
  case 'compile':
    compileFile(args[1]);
    break;
  case 'render':
    renderFile(args[1]);
    break;
  case 'export':
    exportFile(args);
    break;
  case 'validate':
    validateFile(args[1]);
    break;
  case 'init':
    initSample();
    break;
  case 'nl':
    nlCommand(args);
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
