const cron = require('node-cron');
const { fetchDataFromDefinition } = require('@cdl/compiler/fetcher');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * CDL 定时任务调度器
 * 用于定时生成图表报告
 */

class CDLScheduler {
  constructor(outputDir = './reports') {
    this.outputDir = outputDir;
    this.tasks = new Map();
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  /**
   * 添加定时任务
   * @param {string} taskId 任务ID
   * @param {string} cronExpression cron 表达式 (如 '0 9 * * 1' 每周一9点)
   * @param {object} cdlConfig CDL 配置
   * @param {string} outputFormat 输出格式: png, pdf
   */
  addTask(taskId, cronExpression, cdlConfig, outputFormat = 'png') {
    if (this.tasks.has(taskId)) {
      console.log(`Task ${taskId} already exists, removing old task`);
      this.removeTask(taskId);
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`[${new Date().toISOString()}] Running scheduled task: ${taskId}`);
      try {
        await this.generateReport(taskId, cdlConfig, outputFormat);
      } catch (error) {
        console.error(`Task ${taskId} failed:`, error.message);
      }
    });

    this.tasks.set(taskId, { task, cronExpression, cdlConfig, outputFormat });
    console.log(`Scheduled task ${taskId}: ${cronExpression}`);
  }

  /**
   * 移除定时任务
   */
  removeTask(taskId) {
    const entry = this.tasks.get(taskId);
    if (entry) {
      entry.task.stop();
      this.tasks.delete(taskId);
      console.log(`Removed task ${taskId}`);
    }
  }

  /**
   * 立即执行生成报告
   */
  async generateReport(taskId, cdlConfig, format = 'png') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(this.outputDir, `${taskId}_${timestamp}.${format}`);

    // 如果有数据源，先获取数据
    let chartData = cdlConfig.data;
    if (cdlConfig.dataSource?.lang === 'rest' && cdlConfig.dataSource?.config?.source) {
      const fetchResult = await fetchDataFromDefinition(cdlConfig.dataSource);
      if (fetchResult.success) {
        chartData = fetchResult.data;
      } else {
        throw new Error(`Data fetch failed: ${fetchResult.error}`);
      }
    }

    // 生成图表图片
    await this.renderChartToFile(cdlConfig.chart, chartData, outputFile, format);
    console.log(`Report generated: ${outputFile}`);
    return outputFile;
  }

  /**
   * 使用 Puppeteer 渲染图表
   */
  async renderChartToFile(chartConfig, data, outputFile, format) {
    const page = await this.browser.newPage();
    
    const html = this.generateChartHTML(chartConfig, data);
    await page.setContent(html);
    await page.waitForTimeout(1000);

    const element = await page.$('#chart');
    
    if (format === 'pdf') {
      await page.pdf({
        path: outputFile,
        width: '900px',
        height: '700px',
        printBackground: true
      });
    } else {
      await element.screenshot({
        path: outputFile,
        type: format === 'png' ? 'png' : 'jpeg'
      });
    }

    await page.close();
  }

  /**
   * 生成图表 HTML
   */
  generateChartHTML(chartConfig, data) {
    const xField = chartConfig.x;
    const yField = chartConfig.y;
    const xData = data.map(r => r[xField]);
    const yData = data.map(r => r[yField]);

    const echartsOption = {
      title: chartConfig.title ? { text: chartConfig.title, left: 'center' } : undefined,
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: xData },
      yAxis: { type: 'value' },
      series: [{
        type: chartConfig.type || 'line',
        data: yData,
        smooth: chartConfig.style?.includes('平滑')
      }]
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
        <style>body{margin:0}#chart{width:800px;height:600px}</style>
      </head>
      <body>
        <div id="chart"></div>
        <script>
          echarts.init(document.getElementById('chart')).setOption(${JSON.stringify(echartsOption)});
        </script>
      </body>
      </html>
    `;
  }

  /**
   * 列出所有定时任务
   */
  listTasks() {
    return Array.from(this.tasks.entries()).map(([id, config]) => ({
      id,
      cronExpression: config.cronExpression,
      outputFormat: config.outputFormat
    }));
  }

  /**
   * 停止所有任务并清理资源
   */
  async stop() {
    for (const [id, { task }] of this.tasks) {
      task.stop();
    }
    this.tasks.clear();
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = { CDLScheduler };

// CLI 用法
if (require.main === module) {
  const scheduler = new CDLScheduler();
  
  scheduler.init().then(() => {
    // 示例：每天早上9点生成销售报告
    scheduler.addTask('daily-sales', '0 9 * * *', {
      dataSource: {
        lang: 'rest',
        config: { source: process.env.SALES_API_URL }
      },
      chart: {
        type: 'line',
        x: 'date',
        y: 'amount',
        title: '每日销售报告'
      }
    }, 'png');

    console.log('Scheduler started. Press Ctrl+C to stop.');
  });

  process.on('SIGINT', async () => {
    await scheduler.stop();
    process.exit(0);
  });
}