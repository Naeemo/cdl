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
  benchmark <file.cdl>   Run performance benchmark
  init                   Create a sample CDL file
  template               List or use templates
  nl "<description>"     Generate CDL from natural language
  help                   Show this help message

Global Options:
  --verbose, -v          Enable verbose output with detailed logs
  --ast                  Show AST structure in compile/render commands

Benchmark Command:
  cdl benchmark example.cdl         Run performance analysis
  cdl benchmark example.cdl --verbose   Show detailed metrics

Template Command:
  cdl template                    List available templates
  cdl template sales/monthly      Use sales/monthly-trend template
  cdl template bar --output my.cdl  Use bar template with custom output

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

function validateFile(filePath, args = []) {
  if (!filePath) {
    console.error('Error: Please provide a CDL file');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const isVerbose = args.includes('--verbose') || args.includes('-v');
  const source = fs.readFileSync(filePath, 'utf-8');
  
  if (isVerbose) {
    console.log(`📄 Validating: ${filePath}`);
    console.log(`📊 Source: ${source.length} characters, ${source.split('\n').length} lines`);
    console.log('');
  }
  
  const result = compile(source);

  if (result.success) {
    console.log('✓ Valid CDL file');
    console.log(`  Data sources: ${result.result.data.length}`);
    console.log(`  Charts: ${result.result.charts.length}`);
    
    if (isVerbose) {
      console.log('\n📋 Data sources:');
      result.result.data.forEach((d, i) => {
        console.log(`  [${i + 1}] ${d.name} (${d.lang})`);
        if (d.config.source) {
          console.log(`      Source: ${d.config.source}`);
        }
      });
      
      console.log('\n📈 Charts:');
      result.result.charts.forEach((c, i) => {
        console.log(`  [${i + 1}] ${c.name || 'Unnamed'} (${c.chartType})`);
        console.log(`      Data: ${c.dataSources.join(', ')}`);
        console.log(`      Mapping: x=${c.x}, y=${c.y}`);
      });
    }
  } else {
    console.log('✗ Invalid CDL file');
    result.errors.forEach(e => {
      console.error(`  Line ${e.line}, Col ${e.column}: ${e.message}`);
    });
    process.exit(1);
  }
}

function initSample(args) {
  const templates = {
    line: `@lang(data)
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
}`,
    bar: `@lang(data)
RegionData {
    region,sales
    华北,120
    华南,200
    华东,180
}

Chart 区域销售 {
    use RegionData
    type bar
    x region
    y sales
    @color "#667eea"
    @title "各区域销售额"
}`,
    pie: `@lang(data)
CategoryData {
    name,value
    食品,30
    服装,45
    电子,25
}

Chart 分类占比 {
    use CategoryData
    type pie
    x name
    y value
    @style "环形"
    @title "商品分类占比"
}`,
    scatter: `@lang(data)
PriceData {
    price,sales
    10,100
    20,80
    30,60
    40,40
}

Chart 价格销量关系 {
    use PriceData
    type scatter
    x price
    y sales
    @title "价格与销量关系"
}`,
    radar: `@lang(data)
SkillData {
    skill,score
    技术,90
    沟通,80
    管理,70
    创新,85
}

Chart 能力雷达 {
    use SkillData
    type radar
    x skill
    y score
    @color "#9b59b6"
    @title "团队能力评估"
}`,
    sql: `@lang(sql)
@source('https://api.example.com/sales')
SalesData {
    SELECT month, SUM(amount) as total
    FROM sales
    WHERE year = 2024
    GROUP BY month
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y total
    @title "2024年月度销售"
}`,
    rest: `@lang(rest)
@source('https://jsonplaceholder.typicode.com/posts')
PostData {
    // REST API data will be fetched automatically
}

Chart 文章统计 {
    use PostData
    type bar
    x userId
    y id
    @title "各用户文章数"
}`
  };

  // Parse template option
  let template = 'line';
  let outputFile = 'example.cdl';
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--template' && args[i + 1]) {
      template = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    }
  }

  if (!templates[template]) {
    console.error(`Error: Unknown template "${template}"`);
    console.log(`Available templates: ${Object.keys(templates).join(', ')}`);
    process.exit(1);
  }

  fs.writeFileSync(outputFile, templates[template]);
  console.log(`✓ Created ${outputFile} (template: ${template})`);
  console.log(`  Type: cdl compile ${outputFile} to verify`);
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
      await page.waitForTimeout(1000);
      
      // Take screenshot or get SVG
      if (format === 'png') {
        await page.screenshot({ 
          path: outputFile,
          fullPage: false,
          clip: { x: 0, y: 0, width, height }
        });
      } else {
        // For SVG, get the SVG element content
        const svgContent = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          return svg ? svg.outerHTML : null;
        });
        if (svgContent) {
          fs.writeFileSync(outputFile, svgContent);
        }
      }
      
      console.log(`✓ Exported to: ${outputFile}`);
      console.log(`  Format: ${format.toUpperCase()}`);
      console.log(`  Size: ${width}x${height}`);

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

async function previewFile(filePath) {
  if (!filePath) {
    console.error('Error: Please provide a CDL file');
    console.log('Usage: cdl preview <file.cdl> [--port 8080]');
    process.exit(1);
  }

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

  if (!renderResult.success) {
    console.error(`Render error: ${renderResult.error}`);
    process.exit(1);
  }

  const port = 8080;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CDL Preview - ${filePath}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"><\/script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { margin: 0 0 20px 0; font-size: 18px; color: #333; }
    #chart { width: 100%; height: 500px; }
    .info { margin-top: 20px; padding: 10px; background: #f0f9ff; border-radius: 4px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 CDL Preview: ${filePath}</h1>
    <div id="chart"></div>
    <div class="info">
      Data sources: ${compileResult.result.data.length} | 
      Charts: ${compileResult.result.charts.length} |
      <a href="/?raw=1">View source</a>
    </div>
  </div>
  <script>
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption(${JSON.stringify(renderResult.option)});
    window.addEventListener('resize', () => chart.resize());
  <\/script>
</body>
</html>`;

  const server = http.createServer((req, res) => {
    if (req.url === '/?raw=1') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(source);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });

  server.listen(port, () => {
    console.log(`✓ Preview server running at http://localhost:${port}`);
    console.log(`  File: ${filePath}`);
    console.log(`  Press Ctrl+C to stop`);
  });
}

function templateCommand(args) {
  const templatesDir = path.join(__dirname, '../../templates');
  
  // Available templates
  const templates = {
    'sales/monthly': { category: 'sales', name: 'monthly-trend.chart', desc: '月度销售趋势 - 折线图' },
    'sales/region': { category: 'sales', name: 'region-pie.chart', desc: '区域销售占比 - 饼图' },
    'user/growth': { category: 'user', name: 'growth-area.chart', desc: '用户增长趋势 - 面积图' },
    'kpi/dashboard': { category: 'kpi', name: 'dashboard.chart', desc: 'KPI 仪表盘' },
  };

  const subcommand = args[1];

  // List templates
  if (!subcommand || subcommand === 'list') {
    console.log('\n📋 Available Templates:\n');
    Object.entries(templates).forEach(([key, info]) => {
      console.log(`  ${key.padEnd(20)} ${info.desc}`);
    });
    console.log('\nUsage: cdl template <name> [--output file.cdl]');
    console.log('       cdl template sales/monthly --output mychart.cdl');
    return;
  }

  // Use template
  const templateKey = subcommand;
  const template = templates[templateKey];
  
  if (!template) {
    console.error(`Error: Template "${templateKey}" not found`);
    console.log('\nAvailable templates:');
    Object.keys(templates).forEach(k => console.log(`  - ${k}`));
    process.exit(1);
  }

  // Parse output option
  let outputFile = `${templateKey.replace('/', '-')}.cdl`;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    }
  }

  const templatePath = path.join(templatesDir, template.category, template.name);
  
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  fs.writeFileSync(outputFile, content);
  console.log(`✓ Template applied: ${templateKey} -> ${outputFile}`);
}

async function benchmarkCommand(args) {
  const filePath = args[1];
  
  if (!filePath) {
    console.error('Error: Please provide a CDL file');
    console.log('Usage: cdl benchmark <file.cdl> [--iterations 10]');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const iterations = args.includes('--iterations') 
    ? parseInt(args[args.indexOf('--iterations') + 1]) || 10 
    : 10;

  console.log(`Running ${iterations} iterations...\n`);

  const times = {
    compile: [] as number[],
    render: [] as number[],
    total: [] as number[]
  };

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const compileStart = Date.now();
    const compileResult = compile(source);
    const compileTime = Date.now() - compileStart;
    
    if (!compileResult.success) {
      console.error('Compilation failed:', compileResult.errors);
      process.exit(1);
    }
    
    const renderStart = Date.now();
    const renderResult = render(compileResult.result);
    const renderTime = Date.now() - renderStart;
    const totalTime = Date.now() - start;
    
    times.compile.push(compileTime);
    times.render.push(renderTime);
    times.total.push(totalTime);
  }

  // Calculate statistics
  const stats = {
    compile: {
      min: Math.min(...times.compile),
      max: Math.max(...times.compile),
      avg: times.compile.reduce((a, b) => a + b, 0) / times.compile.length
    },
    render: {
      min: Math.min(...times.render),
      max: Math.max(...times.render),
      avg: times.render.reduce((a, b) => a + b, 0) / times.render.length
    },
    total: {
      min: Math.min(...times.total),
      max: Math.max(...times.total),
      avg: times.total.reduce((a, b) => a + b, 0) / times.total.length
    }
  };

  console.log('📊 Performance Benchmark Results\n');
  console.log('Compile:');
  console.log(`  Min: ${stats.compile.min.toFixed(2)}ms`);
  console.log(`  Max: ${stats.compile.max.toFixed(2)}ms`);
  console.log(`  Avg: ${stats.compile.avg.toFixed(2)}ms`);
  console.log('\nRender:');
  console.log(`  Min: ${stats.render.min.toFixed(2)}ms`);
  console.log(`  Max: ${stats.render.max.toFixed(2)}ms`);
  console.log(`  Avg: ${stats.render.avg.toFixed(2)}ms`);
  console.log('\nTotal:');
  console.log(`  Min: ${stats.total.min.toFixed(2)}ms`);
  console.log(`  Max: ${stats.total.max.toFixed(2)}ms`);
  console.log(`  Avg: ${stats.total.avg.toFixed(2)}ms`);
  console.log(`  Throughput: ${(1000 / stats.total.avg).toFixed(1)} charts/sec`);
}

switch (command) {
  case 'compile':
    compileFile(args);
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
  case 'preview':
    previewFile(args[1]);
    break;
  case 'validate':
    validateFile(args[1], args);
    break;
  case 'init':
    initSample(args);
    break;
  case 'template':
    templateCommand(args);
    break;
  case 'benchmark':
    benchmarkCommand(args);
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
