#!/usr/bin/env node

const { compile } = require('@cdl/compiler');
const { render } = require('@cdl/renderer-echarts');
const fs = require('fs');
const path = require('path');
const http = require('http');

const args = process.argv.slice(2);
const command = args[0];

let verboseMode = false;

function showHelp() {
  console.log(`
CDL CLI - Chart Definition Language Command Line Tool

Usage:
  cdl <command> [options]

Commands:
  compile <file.cdl>     Compile CDL to AST JSON
  render <file.cdl>      Render CDL to ECharts option JSON
  export <file.cdl>      Export chart to PNG/SVG/PDF
  batch <dir>            Batch export all .cdl files in directory
  validate <file.cdl>    Validate CDL syntax
  init                   Create a sample CDL file
  nl "<description>"     Generate CDL from natural language
  help                   Show this help message

Global Options:
  --verbose, -v          Enable verbose output with detailed logs
  --ast                  Show AST structure in compile/render commands

Export Command Options:
  cdl export example.cdl --format png --output chart.png
  cdl export example.cdl --format svg --output chart.svg

Init Command Options:
  cdl init                    Create default line chart example
  cdl init --template line    Create line chart template
  cdl init --template bar     Create bar chart template
  cdl init --template pie     Create pie chart template
  cdl init --template scatter Create scatter chart template
  cdl init --template radar   Create radar chart template
  cdl init --template sql     Create SQL data source example

Batch Command Options:
  cdl batch ./charts --format png --output ./exports
  cdl batch ./reports --format pdf --output ./pdfs

NL Command Options:
  cdl nl "show sales trend" --api-key <key>
  cdl nl "pie chart of budget" --output output.cdl

Examples:
  cdl compile example.cdl > output.json
  cdl compile example.cdl --ast              # Show AST with verbose structure
  cdl render example.cdl > echarts.json
  cdl validate example.cdl
  cdl validate example.cdl --verbose         # Show detailed validation info
  cdl nl "line chart of monthly sales, blue color" --api-key $KIMI_API_KEY
`);
}

function compileFile(args) {
  const filePath = args[1];
  const showAst = args.includes('--ast');
  const isVerbose = args.includes('--verbose') || args.includes('-v');
  
  if (!filePath) {
    console.error('Error: Please provide a CDL file');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  
  if (isVerbose) {
    console.log(`📄 Reading file: ${filePath}`);
    console.log(`📊 Source length: ${source.length} characters, ${source.split('\n').length} lines`);
    console.log('');
  }
  
  const result = compile(source);

  if (result.success) {
    if (showAst) {
      console.log('=== Abstract Syntax Tree ===\n');
      console.log(JSON.stringify(result.result, null, 2));
      console.log('\n=== AST Summary ===');
      console.log(`Data sources: ${result.result.data?.length || 0}`);
      console.log(`Charts: ${result.result.charts?.length || 0}`);
      if (result.result.charts?.length > 0) {
        result.result.charts.forEach((chart, i) => {
          console.log(`  Chart ${i + 1}: type=${chart.chartType}, dataSources=[${chart.dataSources?.join(', ')}]`);
        });
      }
    } else {
      console.log(JSON.stringify(result.result, null, 2));
    }
  } else {
    console.error('❌ Compilation failed:');
    result.errors.forEach(e => {
      console.error(`  Line ${e.line}, Col ${e.column}: ${e.message}`);
      if (e.suggestion) {
        console.error(`  💡 ${e.suggestion}`);
      }
    });
    if (isVerbose) {
      console.error('\nDebug info:');
      console.error(`  Total errors: ${result.errors.length}`);
      console.error(`  Source preview (first 200 chars): ${source.substring(0, 200)}...`);
    }
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

async function exportFile(args) {
  const filePath = args[1];
  if (!filePath) {
    console.error('Error: Please provide a CDL file path');
    console.log('Usage: cdl export <file.cdl> --format png --output chart.png');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Parse options
  let format = 'png';
  let outputFile = null;
  let width = 800;
  let height = 600;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--width' && args[i + 1]) {
      width = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--height' && args[i + 1]) {
      height = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (!['png', 'svg'].includes(format)) {
    console.error(`Error: Unsupported format: ${format}. Use 'png' or 'svg'.`);
    process.exit(1);
  }

  if (!outputFile) {
    outputFile = `chart.${format}`;
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

  // Create a simple HTML page with ECharts
  const echartsConfig = JSON.stringify(renderResult.option);
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"><\/script>
  <style>
    body { margin: 0; padding: 0; background: #fff; }
    #chart { width: ${width}px; height: ${height}px; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    const chart = echarts.init(document.getElementById('chart'), null, {
      renderer: '${format === 'svg' ? 'svg' : 'canvas'}'
    });
    const option = ${echartsConfig};
    chart.setOption(option);
    
    // Wait for animation to complete
    setTimeout(() => {
      const dataURL = chart.getDataURL({
        type: '${format}',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      console.log('DATAURL:' + dataURL);
    }, 500);
  <\/script>
</body>
</html>`;

  // Try to use Puppeteer if available, otherwise fallback to simple file export
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    // Puppeteer not available, use fallback
  }

  if (puppeteer) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setViewport({ width, height });
      await page.setContent(htmlContent);
      
      // Wait for chart to render
      await page.waitForFunction(() => {
        const logs = window._consoleLogs || [];
        return logs.some(log => log.startsWith('DATAURL:'));
      }, { timeout: 10000 });

      // Get data URL from console
      const dataURL = await page.evaluate(() => {
        const logs = window._consoleLogs || [];
        const log = logs.find(l => l.startsWith('DATAURL:'));
        return log ? log.replace('DATAURL:', '') : null;
      });

      if (dataURL) {
        const base64Data = dataURL.replace(/^data:image\/(png|svg\+xml);base64,/, '');
        fs.writeFileSync(outputFile, Buffer.from(base64Data, 'base64'));
        console.log(`✓ Exported to: ${outputFile}`);
        console.log(`  Format: ${format.toUpperCase()}`);
        console.log(`  Size: ${width}x${height}`);
      }

      await browser.close();
    } catch (error) {
      console.error(`Export error: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Fallback: Export as HTML with instructions
    const htmlOutputFile = outputFile.replace(/\.(png|svg)$/, '.html');
    fs.writeFileSync(htmlOutputFile, htmlContent.replace(/<\\/script>/g, '</script>'));
    console.log(`⚠ Puppeteer not available. Exported as HTML instead.`);
    console.log(`  HTML file: ${htmlOutputFile}`);
    console.log(`  Open this file in a browser and use the browser console to get the chart image.`);
    console.log(`  To enable direct PNG/SVG export, install puppeteer: npm install -g puppeteer`);
  }
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

async function batchExport(args) {
  const dirPath = args[1];
  if (!dirPath) {
    console.error('Error: Please provide a directory path');
    console.log('Usage: cdl batch <directory> --format png --output ./exports');
    process.exit(1);
  }

  if (!fs.existsSync(dirPath)) {
    console.error(`Error: Directory not found: ${dirPath}`);
    process.exit(1);
  }

  // Parse options
  let format = 'png';
  let outputDir = './exports';

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    }
  }

  if (!['png', 'svg'].includes(format)) {
    console.error('Error: Format must be png or svg');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all .cdl files
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.cdl'));
  
  if (files.length === 0) {
    console.log('No .cdl files found in directory');
    return;
  }

  console.log(`Found ${files.length} CDL files. Starting batch export...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const inputFile = path.join(dirPath, file);
    const outputFile = path.join(outputDir, file.replace('.cdl', `.${format}.html`));
    
    try {
      const source = fs.readFileSync(inputFile, 'utf-8');
      const compileResult = compile(source);

      if (!compileResult.success) {
        console.error(`✗ ${file}: Compilation failed`);
        failCount++;
        continue;
      }

      const renderResult = render(compileResult.result);

      if (!renderResult.success) {
        console.error(`✗ ${file}: Render failed - ${renderResult.error}`);
        failCount++;
        continue;
      }

      // Generate HTML
      const html = generateChartHTML(renderResult.option, format);
      fs.writeFileSync(outputFile, html);
      
      console.log(`✓ ${file} -> ${path.basename(outputFile)}`);
      successCount++;
    } catch (error) {
      console.error(`✗ ${file}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\nBatch export complete: ${successCount} succeeded, ${failCount} failed`);
  console.log(`Output directory: ${outputDir}`);
  console.log('Note: Open HTML files in browser and save as image manually');
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
  case 'batch':
    batchExport(args);
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
