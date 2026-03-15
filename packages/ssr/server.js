const express = require('express');
const { compile } = require('@cdl/compiler');
const { render } = require('@cdl/renderer-echarts');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let browser;

// 启动浏览器
async function initBrowser() {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

// 渲染图表为图片
async function renderChart(echartsOption, format = 'png') {
  const page = await browser.newPage();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
      <style>body{margin:0}#c{width:800px;height:600px}</style>
    </head>
    <body><div id="c"></div>
    <script>
      const chart=echarts.init(document.getElementById('c'));
      chart.setOption(${JSON.stringify(echartsOption)});
    </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForTimeout(500);
  
  const element = await page.$('#c');
  const screenshot = await element.screenshot({
    type: format === 'png' ? 'png' : 'jpeg',
    encoding: 'binary'
  });
  
  await page.close();
  return screenshot;
}

// API 端点: 编译 CDL
app.post('/api/compile', (req, res) => {
  const { source } = req.body;
  const result = compile(source);
  res.json(result);
});

// API 端点: 渲染 CDL 为 ECharts 配置
app.post('/api/render', (req, res) => {
  const { source } = req.body;
  const compileResult = compile(source);
  
  if (!compileResult.success) {
    return res.status(400).json(compileResult);
  }
  
  const renderResult = render(compileResult.result);
  res.json(renderResult);
});

// API 端点: 导出图片
app.post('/api/export', async (req, res) => {
  try {
    const { source, format = 'png' } = req.body;
    const compileResult = compile(source);
    
    if (!compileResult.success) {
      return res.status(400).json(compileResult);
    }
    
    const renderResult = render(compileResult.result);
    
    if (!renderResult.success) {
      return res.status(400).json(renderResult);
    }
    
    const image = await renderChart(renderResult.option, format);
    
    res.set('Content-Type', format === 'png' ? 'image/png' : 'image/jpeg');
    res.send(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', browser: !!browser });
});

const PORT = process.env.PORT || 3000;

initBrowser().then(() => {
  app.listen(PORT, () => {
    console.log(`CDL Server running on port ${PORT}`);
  });
});

module.exports = { app, renderChart };