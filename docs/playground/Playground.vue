<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// 自定义指令：点击外部关闭
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside, true)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside, true)
  }
}

// 响应式布局状态
const layoutMode = ref('horizontal')
const isMobile = ref(false)

const checkBreakpoint = () => {
  const width = window.innerWidth
  isMobile.value = width < 768
  if (isMobile.value && layoutMode.value === 'horizontal') {
    layoutMode.value = 'vertical'
  }
}

onMounted(() => {
  checkBreakpoint()
  window.addEventListener('resize', checkBreakpoint)
  
  const saved = localStorage.getItem('cdl-playground-layout')
  if (saved && ['horizontal', 'vertical'].includes(saved)) {
    layoutMode.value = saved
  }
  
  // Focus management - focus the editor on load
  nextTick(() => {
    const editor = document.querySelector('.code-editor')
    if (editor) {
      editor.focus()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkBreakpoint)
})

const toggleLayout = () => {
  layoutMode.value = layoutMode.value === 'horizontal' ? 'vertical' : 'horizontal'
  localStorage.setItem('cdl-playground-layout', layoutMode.value)
  announce(`已切换到${layoutMode.value === 'horizontal' ? '水平' : '垂直'}布局`)
}

// Screen reader announcement
const liveRegion = ref(null)
const announce = (message) => {
  if (liveRegion.value) {
    liveRegion.value.textContent = message
    setTimeout(() => {
      if (liveRegion.value) {
        liveRegion.value.textContent = ''
      }
    }, 1000)
  }
}

// 从 URL 参数或本地存储加载代码
function getInitialCode() {
  // 1. 优先从 URL 参数加载
  const urlParams = new URLSearchParams(window.location.search)
  const codeParam = urlParams.get('code')
  if (codeParam) {
    try {
      return decodeURIComponent(escape(atob(codeParam)))
    } catch (e) {
      console.error('Failed to decode URL code:', e)
    }
  }
  
  // 2. 从本地存储加载
  const saved = localStorage.getItem('cdl-playground-code')
  if (saved) return saved
  
  // 3. 默认示例 - v0.6 combo 图表
  return `@lang(data)
SalesData {
    month,sales,profit
    1月,120,15
    2月,150,18
    3月,180,22
}

# 月度销售分析

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| sales | 销售额(万元) | bar | #4fc3f7 | left | solid |
| profit | 利润(万元) | line | #ff9800 | right | smooth |

## axis y
min: 0
max: 200

## axis y2
min: 0
max: 50
labelFormatter: "{value}%"

@title "销售额 vs 利润"
@color "#4fc3f7"
@interaction "tooltip:shared zoom:inside"`
}

const cdlCode = ref(getInitialCode())

const loading = ref(false)
const error = ref('')
const echartsOption = ref(null)
const chartRef = ref(null)
const selectedExample = ref('line')
const isDirty = ref(false)
const autoRefresh = ref(false)
const autoRefreshInterval = ref(null)
let chartInstance = null

const shareUrl = ref('')
const showShareModal = ref(false)

// 导出配置
const showExportMenu = ref(false)
const exportConfig = ref({
  pngPixelRatio: 2,
  pngBackground: '#ffffff',
  pdfPageSize: 'a4',
  pdfOrientation: 'portrait',
  pdfIncludeSource: true
})

// Toast 提示
const toast = ref({ show: false, message: '', timer: null })
function showToast(message, duration = 2000) {
  if (toast.value.timer) clearTimeout(toast.value.timer)
  toast.value.message = message
  toast.value.show = true
  toast.value.timer = setTimeout(() => {
    toast.value.show = false
  }, duration)
}

const examples = [
  { name: 'line', label: '📈 折线', description: '折线图示例 - 展示数据随时间变化的趋势' },
  { name: 'bar', label: '📊 柱状', description: '柱状图示例 - 比较不同类别的数值大小' },
  { name: 'pie', label: '🥧 饼图', description: '饼图示例 - 展示各部分占整体的比例' },
  { name: 'scatter', label: '⚪ 散点', description: '散点图示例 - 展示两个变量之间的关系' },
  { name: 'area', label: '🌊 面积', description: '面积图示例 - 强调数量随时间的变化程度' },
  { name: 'radar', label: '🕸️ 雷达', description: '雷达图示例 - 展示多维数据的相对大小' },
  { name: 'combo', label: '🔀 组合图(v0.6)', description: '组合图示例 - 同时展示柱状图和折线图' },
  { name: 'multi-axis', label: '📏 多轴(v0.6)', description: '多轴图示例 - 展示不同量纲的数据对比' },
  { name: 'interaction', label: '🎮 交互(v0.6)', description: '交互图示例 - 包含缩放和刷选功能' }
]

const exampleCodes = {
  line: `@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
}

Chart {
    use SalesData
    type line
    x month
    y sales
    @style "平滑曲线"
    @color "#4fc3f7"
}`,
  bar: `@lang(data)
RegionData {
    region,sales
    华北,120
    华南,200
    华东,180
}

Chart {
    use RegionData
    type bar
    x region
    y sales
    @color "#667eea"
}`,
  pie: `@lang(data)
CategoryData {
    name,value
    食品,30
    服装,45
    电子,25
}

Chart {
    use CategoryData
    type pie
    x name
    y value
    @style "环形"
}`,
  scatter: `@lang(data)
PriceData {
    price,sales
    10,100
    20,80
    30,60
    40,40
}

Chart {
    use PriceData
    type scatter
    x price
    y sales
}`,
  area: `@lang(data)
GrowthData {
    month,users
    1月,100
    2月,150
    3月,220
}

Chart {
    use GrowthData
    type area
    x month
    y users
    @style "渐变填充"
}`,
  radar: `@lang(data)
SkillData {
    skill,score
    技术,90
    沟通,80
    管理,70
    创新,85
}

Chart {
    use SkillData
    type radar
    x skill
    y score
    @color "#9b59b6"
}`,
  combo: `@lang(data)
SalesData {
    month,sales,profit
    1月,120,15
    2月,150,18
    3月,180,22
}

# 月度销售分析

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| sales | 销售额(万元) | bar | #4fc3f7 | left | solid |
| profit | 利润(万元) | line | #ff9800 | right | smooth |

## axis y
min: 0
max: 200

## axis y2
min: 0
max: 50

@title "销售额 vs 利润"
@interaction "tooltip:shared zoom:inside"`,
  'multi-axis': `@lang(data)
TrafficData {
    date,visits,conversions
    1日,1000,50
    2日,1200,65
    3日,1100,58
}

# 流量转化分析

## combo

## series
| field | as | type | color | axis |
| --- | --- | --- | --- | --- |
| visits | 访问量 | bar | #4fc3f7 | left |
| conversions | 转化数 | line | #ff9800 | right |

## axis x
labelRotate: 45

## axis y
min: 0
max: 1500

## axis y2
min: 0
max: 100
position: right

@title "流量与转化"
@interaction "zoom:slider"`,
  interaction: `@lang(data)
GrowthData {
    month,users,revenue
    1月,100,50
    2月,150,75
    3月,220,110
    4月,300,150
}

# 用户增长与收入

## combo

## series
| field | as | type | color |
| --- | --- | --- | --- |
| users | 用户数 | line | #4fc3f7 |
| revenue | 收入(万元) | bar | #ff9800 |

@title "增长趋势"
@interaction "tooltip:shared brush:true zoom:inside"

## axis y
splitLine: false`
}

let debounceTimer = null
watch(cdlCode, () => {
  isDirty.value = true
  // 自动保存到本地存储
  localStorage.setItem('cdl-playground-code', cdlCode.value)
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    run()
  }, 300)
})

function loadExample() {
  if (selectedExample.value && exampleCodes[selectedExample.value]) {
    cdlCode.value = exampleCodes[selectedExample.value]
    const example = examples.find(e => e.name === selectedExample.value)
    announce(`已加载示例: ${example?.label}`)
  }
}

// CSV 粘贴处理
function handlePaste(event) {
  const text = event.clipboardData.getData('text')
  // 检测是否为 CSV 格式（包含逗号和换行）
  if (text.includes(',') && text.includes('\n') && !text.includes('{')) {
    event.preventDefault()
    const lines = text.trim().split('\n')
    if (lines.length < 2) return
    
    const dataName = 'PastedData'
    const headers = lines[0].split(',').map(h => h.trim())
    const dataLines = lines.slice(1, 11)
    
    let cdl = `@lang(data)\n${dataName} {\n    ${headers.join(',')}\n`
    dataLines.forEach(line => {
      cdl += `    ${line.trim()}\n`
    })
    cdl += `}\n\nChart {\n    use ${dataName}\n    type line\n    x ${headers[0]}\n    y ${headers[1] || headers[0]}\n}`
    
    cdlCode.value = cdl
    announce('已检测到CSV数据并转换为CDL代码')
    run()
  }
}

// CSV 文件上传处理
function handleCSVUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const csv = e.target.result
    const dataName = file.name.replace('.csv', '').replace(/[^a-zA-Z0-9]/g, '')
    const lines = csv.trim().split('\n')
    if (lines.length < 2) {
      error.value = 'CSV 文件需要至少包含表头和一行数据'
      return
    }
    
    // 解析 CSV 生成 CDL
    const headers = lines[0].split(',').map(h => h.trim())
    const dataLines = lines.slice(1, 11) // 最多取10行示例
    
    let cdl = `@lang(data)\n${dataName} {\n    ${headers.join(',')}\n`
    dataLines.forEach(line => {
      cdl += `    ${line.trim()}\n`
    })
    cdl += `}\n\nChart {\n    use ${dataName}\n    type line\n    x ${headers[0]}\n    y ${headers[1] || headers[0]}\n}`
    
    cdlCode.value = cdl
    announce(`已上传CSV文件: ${file.name}`)
    run()
  }
  reader.readAsText(file)
}

function refresh() {
  run()
  announce('图表已刷新')
}

// 自动刷新控制
function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    autoRefreshInterval.value = setInterval(() => {
      if (!loading.value) {
        run()
      }
    }, 5000) // 每5秒刷新
    announce('已开启自动刷新，每5秒刷新一次')
  } else {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
    announce('已停止自动刷新')
  }
}

async function run() {
  loading.value = true
  error.value = ''
  
  try {
    const result = compileCDL(cdlCode.value)
    if (!result.success) {
      error.value = result.error
      echartsOption.value = null
      return
    }
    
    const renderResult = renderChartOption(result.data, result.chart)
    if (!renderResult.success) {
      error.value = renderResult.error
      echartsOption.value = null
      return
    }
    
    echartsOption.value = renderResult.option
    isDirty.value = false
    
    await nextTick()
    renderChart()
  } catch (e) {
    error.value = e.message
    echartsOption.value = null
  } finally {
    loading.value = false
  }
}

function compileCDL(source) {
  const lines = source.split('\n')
  let dataName = ''
  let dataLines = []
  let chartLines = []
  let inData = false
  let inChart = false
  let braceCount = 0
  let expectingDataName = false
  
  for (const rawLine of lines) {
    const line = rawLine.trim()
    
    // Data 开始（@lang(data) 单独一行）
    if (!inData && !inChart && line === '@lang(data)') {
      expectingDataName = true
      continue
    }
    
    // 期望 DataName { 
    if (expectingDataName) {
      const m = line.match(/^(\w+)\s*\{/)
      if (m) {
        dataName = m[1]
        inData = true
        expectingDataName = false
        braceCount = 1
        // 检查同一行是否有内容
        const contentStart = line.indexOf('{')
        if (contentStart !== -1 && contentStart < line.length - 1) {
          const afterBrace = line.slice(contentStart + 1).trim()
          if (afterBrace) dataLines.push(afterBrace)
        }
      }
      continue
    }
    
    // Data 内部
    if (inData && !inChart) {
      braceCount += (line.match(/\{/g) || []).length
      braceCount -= (line.match(/\}/g) || []).length
      
      if (braceCount <= 0) {
        inData = false
        continue
      }
      dataLines.push(line)
      continue
    }
    
    // Chart 开始
    if (!inData && !inChart && line.startsWith('Chart')) {
      inChart = true
      braceCount = line.split('{').length - 1 - (line.split('}').length - 1)
      if (braceCount <= 0 && line.includes('{')) braceCount = 1
      // 如果这一行有内容（除了Chart和{），也要处理
      const contentStart = line.indexOf('{')
      if (contentStart !== -1 && contentStart < line.length - 1) {
        const afterBrace = line.slice(contentStart + 1).trim()
        if (afterBrace) chartLines.push(afterBrace)
      }
      continue
    }
    
    // Chart 内部
    if (inChart) {
      braceCount += (line.match(/\{/g) || []).length
      braceCount -= (line.match(/\}/g) || []).length
      
      if (braceCount <= 0) {
        inChart = false
        continue
      }
      chartLines.push(line)
    }
  }
  
  if (!dataName) return { success: false, error: '未找到数据定义' }
  if (dataLines.length < 2) return { success: false, error: '数据需要表头和数据行' }
  if (chartLines.length === 0) return { success: false, error: '未找到 Chart 定义' }
  
  // 解析数据
  const headers = dataLines[0].split(',').map(h => h.trim())
  const rows = dataLines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => {
      row[h] = isNaN(Number(values[i])) ? values[i] : Number(values[i])
    })
    return row
  })
  
  // 解析 Chart
  const chartText = chartLines.join('\n')
  const useMatch = chartText.match(/use\s+(\w+)/)
  if (!useMatch || useMatch[1] !== dataName) {
    return { success: false, error: `Chart 必须使用数据源 ${dataName}` }
  }
  
  return {
    success: true,
    data: { name: dataName, headers, rows },
    chart: {
      type: chartText.match(/type\s+(\w+)/)?.[1] || 'line',
      xField: chartText.match(/x\s+(\w+)/)?.[1] || headers[0],
      yField: chartText.match(/y\s+(\w+)/)?.[1] || headers[1] || headers[0],
      title: chartText.match(/@title\s+"([^"]+)"/)?.[1],
      style: chartText.match(/@style\s+"([^"]+)"/)?.[1],
      color: chartText.match(/@color\s+"([^"]+)"/)?.[1]
    }
  }
}

function renderChartOption(data, chart) {
  const xData = data.rows.map(r => r[chart.xField])
  const yData = data.rows.map(r => r[chart.yField])
  
  const option = {
    animation: true,
    title: chart.title ? { text: chart.title, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value' },
    series: [{
      type: chart.type === 'area' ? 'line' : chart.type,
      data: yData,
      smooth: chart.style?.includes('平滑'),
      areaStyle: chart.type === 'area' ? {} : undefined
    }],
    color: chart.color ? [chart.color] : undefined
  }
  
  if (chart.type === 'pie') {
    delete option.xAxis
    delete option.yAxis
    delete option.grid
    option.series = [{
      type: 'pie',
      radius: chart.style?.includes('环形') ? ['40%', '70%'] : '60%',
      data: data.rows.map(r => ({ name: r[chart.xField], value: r[chart.yField] }))
    }]
    option.tooltip = { trigger: 'item' }
  }
  
  if (chart.type === 'radar') {
    delete option.xAxis
    delete option.yAxis
    const maxValue = Math.max(...yData) * 1.2
    option.radar = {
      indicator: data.rows.map(r => ({ name: r[chart.xField], max: maxValue }))
    }
    option.series = [{
      type: 'radar',
      data: [{ value: yData, name: chart.yField }]
    }]
  }
  
  if (chart.type === 'scatter') {
    option.series = [{
      type: 'scatter',
      data: data.rows.map(r => [r[chart.xField], r[chart.yField]]),
      symbolSize: 15
    }]
    option.tooltip = {
      formatter: (params) => `${chart.xField}: ${params.data[0]}<br/${chart.yField}: ${params.data[1]}`
    }
  }
  
  return { success: true, option }
}

function renderChart() {
  if (!chartRef.value || !echartsOption.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(echartsOption.value, true)
}

// 生成分享链接
function generateShareLink() {
  const encoded = btoa(unescape(encodeURIComponent(cdlCode.value)))
  const url = new URL(window.location.href)
  url.searchParams.set('code', encoded)
  shareUrl.value = url.toString()
  showShareModal.value = true
  announce('分享链接已生成')
}

function copyShareLink() {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    showToast('链接已复制到剪贴板！')
    announce('链接已复制到剪贴板')
  })
}

function closeShareModal() {
  showShareModal.value = false
}

// 导出 iframe 嵌入代码
function generateEmbedCode() {
  const encoded = btoa(unescape(encodeURIComponent(cdlCode.value)))
  const url = new URL(window.location.href)
  url.searchParams.set('code', encoded)
  const embedCode = `<iframe src="${url.toString()}" width="100%" height="600" frameborder="0"></iframe>`
  navigator.clipboard.writeText(embedCode).then(() => {
    showExportMenu.value = false
    showToast('嵌入代码已复制到剪贴板！')
    announce('嵌入代码已复制到剪贴板')
  })
}
function exportPNG() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: exportConfig.value.pngPixelRatio,
    backgroundColor: exportConfig.value.pngBackground
  })
  download(url, 'cdl-chart.png')
  showExportMenu.value = false
  showToast('PNG 导出成功！')
  announce('PNG图片已导出')
}

function exportSVG() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({
    type: 'svg',
    pixelRatio: 2
  })
  download(url, 'cdl-chart.svg')
  showExportMenu.value = false
  showToast('SVG 导出成功！')
  announce('SVG矢量图已导出')
}

// 导出PDF - 使用浏览器原生打印功能实现高质量PDF导出
function exportPDF() {
  if (!chartInstance) return
  showExportMenu.value = false
  showToast('正在生成 PDF...', 3000)
  announce('正在生成PDF文档')
  
  // 获取图表的dataURL（高分辨率PNG）
  const chartUrl = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 3, // 更高分辨率
    backgroundColor: '#fff'
  })
  
  // 获取CDL代码标题或默认标题
  const titleMatch = cdlCode.value.match(/@title\s+"([^"]+)"/)
  const chartTitle = titleMatch ? titleMatch[1] : 'CDL Chart'
  
  // 创建PDF打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF')
    return
  }
  
  // 获取图表尺寸
  const chartWidth = chartInstance.getWidth()
  const chartHeight = chartInstance.getHeight()
  const aspectRatio = chartWidth / chartHeight
  
  // 计算适合A4页面的尺寸（保持宽高比）
  // A4: 210mm x 297mm，保留边距
  const a4Width = 190 // mm
  const a4Height = 277 // mm
  
  let imgWidth = a4Width
  let imgHeight = imgWidth / aspectRatio
  
  // 如果高度超出页面，以高度为基准
  if (imgHeight > a4Height - 40) { // 预留标题空间
    imgHeight = a4Height - 40
    imgWidth = imgHeight * aspectRatio
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${chartTitle}</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fff;
          padding: 10mm;
        }
        .container {
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #0969da;
        }
        .title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2328;
          margin-bottom: 8px;
        }
        .meta {
          font-size: 10px;
          color: #656d76;
        }
        .chart-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200mm;
        }
        .chart-img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 9px;
          color: #8c959f;
          padding-top: 10px;
          border-top: 1px solid #d0d7de;
        }
        .cdl-code {
          margin-top: 20px;
          padding: 12px;
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 8px;
          line-height: 1.5;
          color: #24292f;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 60mm;
          overflow: hidden;
        }
        .cdl-label {
          font-size: 10px;
          font-weight: 600;
          color: #656d76;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">${chartTitle}</div>
          <div class="meta">CDL Chart Export • ${new Date().toLocaleString('zh-CN')}</div>
        </div>
        <div class="chart-wrapper">
          <img class="chart-img" src="${chartUrl}" style="width: ${imgWidth}mm; height: auto;" alt="Chart" />
        </div>
        <div class="cdl-label">CDL Source Code</div>
        <pre class="cdl-code">${cdlCode.value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <div class="footer">
          Generated by CDL Playground • github.com/naeemo/cdl
        </div>
      </div>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #0969da; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          🖨️ 打印 / 保存为PDF
        </button>
        <button onclick="window.close()" style="padding: 8px 16px; background: #f6f8fa; color: #24292f; border: 1px solid #d0d7de; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 8px;">
          关闭
        </button>
      </div>
      <${'script'}>
        // 自动触发打印对话框（可选，用户可以选择取消）
        // setTimeout(() => window.print(), 500);
      </${'script'}>
    </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}

function download(url, filename) {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  run()
  window.addEventListener('resize', () => chartInstance?.resize())
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  showExportMenu.value = false
})

watch(echartsOption, () => nextTick(renderChart))

// Keyboard shortcuts
function handleKeyDown(event) {
  // Ctrl/Cmd + Enter to refresh
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    refresh()
  }
  // Escape to close modals/menus
  if (event.key === 'Escape') {
    if (showShareModal.value) {
      showShareModal.value = false
    } else if (showExportMenu.value) {
      showExportMenu.value = false
    }
  }
}
</script>

<template>
  <div 
    class="playground" 
    :class="layoutMode"
    @keydown="handleKeyDown"
    role="main"
    aria-label="CDL图表编辑器"
  >
    <!-- Screen reader live region -->
    <div
      ref="liveRegion"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    ></div>
    
    <!-- Skip to content link for keyboard navigation -->
    <a 
      href="#preview-pane" 
      class="skip-link"
    >
      跳转到预览区
    </a>
    
    <div class="editor-pane" role="region" aria-label="代码编辑区">
      <div class="pane-header">
        <div class="header-left">
          <span class="title" id="editor-title">CDL</span>
          <span v-if="isDirty" class="dot" aria-label="有未保存的更改"></span>
          <button 
            class="btn-layout" 
            @click="toggleLayout" 
            :title="layoutMode === 'horizontal' ? '切换为垂直布局' : '切换为水平布局'"
            :aria-label="layoutMode === 'horizontal' ? '切换为垂直布局' : '切换为水平布局'"
          >
            {{ layoutMode === 'horizontal' ? '🔀' : '📱' }}
          </button>
        </div>
        <div class="header-actions">
          <div class="file-input-wrapper">
            <input 
              type="file" 
              accept=".csv" 
              @change="handleCSVUpload" 
              class="file-input" 
              id="csv-upload"
              aria-label="上传CSV文件"
            />
            <label for="csv-upload" class="file-input-label" title="上传CSV">
              📁 CSV
            </label>
          </div>
          <button 
            class="btn-auto-refresh" 
            :class="{ active: autoRefresh }"
            @click="toggleAutoRefresh" 
            :aria-pressed="autoRefresh"
            :aria-label="autoRefresh ? '停止自动刷新' : '开启自动刷新(5秒间隔)'"
            :title="autoRefresh ? '停止自动刷新' : '开启自动刷新(5s)'"
          >
            {{ autoRefresh ? '⏸' : '▶' }}
          </button>
          <button 
            class="btn-share" 
            @click="generateShareLink" 
            aria-label="生成分享链接"
            title="分享链接"
          >
            🔗
          </button>
          <select 
            v-model="selectedExample" 
            @change="loadExample" 
            class="example-select"
            aria-label="选择示例图表"
          >
            <option value="" disabled>选择示例...</option>
            <option v-for="ex in examples" :key="ex.name" :value="ex.name">
              {{ ex.label }}
            </option>
          </select>
          <button 
            class="btn-refresh" 
            @click="refresh" 
            aria-label="刷新图表 (Ctrl+Enter)"
            title="重新渲染 (Ctrl+Enter)"
          >
            <span class="icon">↻</span>
          </button>
        </div>
      </div>
      <textarea 
        v-model="cdlCode" 
        class="code-editor" 
        placeholder="输入 CDL 代码...或粘贴 CSV" 
        spellcheck="false" 
        @paste="handlePaste"
        role="textbox"
        aria-multiline="true"
        aria-labelledby="editor-title"
        aria-describedby="editor-help"
      />
      <div id="editor-help" class="sr-only">
        输入CDL代码定义数据和图表。支持粘贴CSV数据自动转换。使用Ctrl+Enter快速刷新预览。
      </div>
    </div>

    <div 
      class="preview-pane" 
      id="preview-pane"
      role="region" 
      aria-label="图表预览区"
    >
      <div class="pane-header">
        <span class="title" id="preview-title">预览</span>
        <div class="header-actions">
          <div class="export-menu-wrapper">
            <button 
              class="btn-export btn-export-primary" 
              @click="showExportMenu = !showExportMenu"
              aria-haspopup="true"
              :aria-expanded="showExportMenu"
              aria-label="导出选项"
            >
              📥 导出
            </button>
            <div 
              v-if="showExportMenu" 
              class="export-dropdown" 
              v-click-outside="() => showExportMenu = false"
              role="menu"
              aria-label="导出格式选项"
            >
              <div class="export-group">
                <div class="export-label" role="separator">图片格式</div>
                <div class="export-options" role="group" aria-label="图片导出选项">
                  <button 
                    class="export-option" 
                    @click="exportPNG" 
                    role="menuitem"
                    aria-label="导出为PNG图片格式"
                  >
                    <span class="export-icon" aria-hidden="true">🖼️</span>
                    <span class="export-text">
                      <strong>PNG</strong>
                      <small>高分辨率图片</small>
                    </span>
                  </button>
                  <button 
                    class="export-option" 
                    @click="exportSVG" 
                    role="menuitem"
                    aria-label="导出为SVG矢量图形格式"
                  >
                    <span class="export-icon" aria-hidden="true">✨</span>
                    <span class="export-text">
                      <strong>SVG</strong>
                      <small>矢量图形</small>
                    </span>
                  </button>
                </div>
              </div>
              <div class="export-divider" role="separator"></div>
              <div class="export-group">
                <div class="export-label" role="separator">文档格式</div>
                <button 
                  class="export-option" 
                  @click="exportPDF" 
                  role="menuitem"
                  aria-label="导出为PDF文档格式"
                >
                  <span class="export-icon" aria-hidden="true">📄</span>
                  <span class="export-text">
                    <strong>PDF</strong>
                    <small>A4文档含源代码</small>
                  </span>
                </button>
              </div>
              <div class="export-divider" role="separator"></div>
              <div class="export-group">
                <div class="export-label" role="separator">其他</div>
                <button 
                  class="export-option" 
                  @click="generateEmbedCode" 
                  role="menuitem"
                  aria-label="复制iframe嵌入代码"
                >
                  <span class="export-icon" aria-hidden="true">🔗</span>
                  <span class="export-text">
                    <strong>嵌入代码</strong>
                    <small>iframe 嵌入</small>
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div 
            v-if="loading" 
            class="loading-dot" 
            aria-label="正在加载"
            role="status"
          ></div>
        </div>
      </div>
      <div class="preview-content">
        <div 
          v-if="error" 
          class="error-message"
          role="alert"
          aria-live="assertive"
        >
          {{ error }}
        </div>
        <div 
          v-else-if="echartsOption" 
          ref="chartRef" 
          class="chart-container"
          role="img"
          :aria-label="`图表预览: ${echartsOption?.title?.text || '数据图表'}`"
          tabindex="0"
        ></div>
        <div 
          v-else 
          class="placeholder"
          role="status"
          aria-live="polite"
        >
          输入 CDL 代码查看图表
        </div>
      </div>
    </div>
  </div>

  <!-- 分享模态框 -->
  <div 
    v-if="showShareModal" 
    class="modal-overlay" 
    @click="closeShareModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="share-modal-title"
  >
    <div class="modal" @click.stop>
      <h3 id="share-modal-title">🔗 分享链接</h3>
      <input 
        type="text" 
        :value="shareUrl" 
        readonly 
        class="share-input"
        aria-label="分享链接"
        aria-readonly="true"
      />
      <div class="modal-actions">
        <button class="btn-primary" @click="copyShareLink">复制链接</button>
        <button class="btn-secondary" @click="closeShareModal">关闭</button>
      </div>
    </div>
  </div>
  
  <!-- Toast 提示 -->
  <div 
    v-if="toast.show" 
    class="toast" 
    :class="{ show: toast.show }"
    role="status"
    aria-live="polite"
  >
    {{ toast.message }}
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.playground { 
  display: flex; 
  width: 100%; 
  height: 600px; 
  background: #0d1117; 
  border-radius: 8px; 
  overflow: hidden; 
  border: 1px solid #30363d; 
}
.playground.horizontal { flex-direction: row; }
.playground.vertical { flex-direction: column; height: 800px; }

.editor-pane { 
  width: 50%; 
  min-width: 0; 
  display: flex; 
  flex-direction: column; 
  background: #0d1117; 
  border-right: 1px solid #30363d; 
}
.playground.vertical .editor-pane {
  width: 100%;
  height: 50%;
  border-right: none;
  border-bottom: 1px solid #30363d;
}

.pane-header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 8px 12px; 
  background: #161b22; 
  border-bottom: 1px solid #30363d; 
  height: 40px; 
  flex-shrink: 0; 
}

.header-left { display: flex; align-items: center; gap: 8px; }

.title { 
  font-weight: 600; 
  font-size: 12px; 
  color: #c9d1d9; 
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
}

.dot { 
  width: 6px; 
  height: 6px; 
  background: #58a6ff; 
  border-radius: 50%; 
  animation: pulse 2s infinite; 
}

@keyframes pulse { 
  0%, 100% { opacity: 1; } 
  50% { opacity: 0.5; } 
}

.header-actions { display: flex; align-items: center; gap: 6px; }

.btn-layout { 
  padding: 4px 8px; 
  background: #21262d; 
  border: 1px solid #30363d; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 12px; 
  color: #c9d1d9; 
  transition: all 0.2s; 
}
.btn-layout:hover { 
  background: #30363d; 
  border-color: #58a6ff; 
}

.file-input-wrapper {
  position: relative;
  display: inline-block;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-input-label {
  display: inline-block;
  padding: 4px 8px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 4px;
  font-size: 11px;
  color: #c9d1d9;
  cursor: pointer;
  transition: all 0.2s;
}
.file-input-label:hover {
  background: #30363d;
  border-color: #58a6ff;
}

.example-select { 
  padding: 4px 8px; 
  background: #21262d; 
  border: 1px solid #30363d; 
  border-radius: 4px; 
  font-size: 12px; 
  color: #c9d1d9; 
  cursor: pointer; 
  outline: none; 
}
.example-select:hover { border-color: #58a6ff; }

.btn-auto-refresh { 
  padding: 4px 8px; 
  background: #21262d; 
  border: 1px solid #30363d; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 12px; 
  color: #c9d1d9; 
  transition: all 0.2s; 
}
.btn-auto-refresh:hover { 
  background: #30363d; 
  border-color: #58a6ff; 
}
.btn-auto-refresh.active { 
  background: #238636; 
  border-color: #238636; 
}

.btn-refresh { 
  padding: 4px 8px; 
  background: #21262d; 
  border: 1px solid #30363d; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px; 
  color: #c9d1d9; 
  transition: all 0.2s; 
}
.btn-refresh:hover { 
  background: #30363d; 
  border-color: #58a6ff; 
}
.btn-refresh .icon { display: inline-block; transition: transform 0.3s; }
.btn-refresh:hover .icon { transform: rotate(180deg); }

.btn-export { 
  padding: 4px 10px; 
  background: #21262d; 
  border: 1px solid #30363d; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 11px; 
  color: #c9d1d9; 
  transition: all 0.2s; 
}
.btn-export:hover { 
  background: #30363d; 
  border-color: #58a6ff; 
}

.preview-pane .btn-export { 
  background: #f6f8fa; 
  border-color: #d0d7de; 
  color: #24292f; 
}
.preview-pane .btn-export:hover { 
  background: #fff; 
  border-color: #0969da; 
}

.code-editor { 
  flex: 1; 
  padding: 12px; 
  border: none; 
  outline: none; 
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace; 
  font-size: 13px; 
  line-height: 1.5; 
  resize: none; 
  background: #0d1117; 
  color: #c9d1d9; 
  tab-size: 4; 
  min-height: 0; 
}
.code-editor::placeholder { color: #484f58; }
.code-editor:focus {
  outline: 2px solid #58a6ff;
  outline-offset: -2px;
}

.preview-pane { 
  width: 50%; 
  min-width: 0; 
  display: flex; 
  flex-direction: column; 
  background: #ffffff; 
}
.playground.vertical .preview-pane {
  width: 100%;
  height: 50%;
}
.preview-pane .pane-header { 
  background: #f6f8fa; 
  border-bottom: 1px solid #d0d7de; 
}
.preview-pane .title { color: #24292f; }

.loading-dot { 
  width: 6px; 
  height: 6px; 
  background: #0969da; 
  border-radius: 50%; 
  animation: blink 1s infinite; 
}
@keyframes blink { 
  0%, 100% { opacity: 0.3; } 
  50% { opacity: 1; } 
}

.preview-content { 
  flex: 1; 
  padding: 16px; 
  overflow: auto; 
  display: flex; 
  flex-direction: column; 
  min-height: 0; 
}

.chart-container { 
  flex: 1; 
  min-height: 200px; 
  width: 100%; 
}
.chart-container:focus {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

.placeholder { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #8c959f; 
  font-size: 13px; 
}

.error-message { 
  padding: 12px; 
  background: #fff2f0; 
  border: 1px solid #ffccc7; 
  border-radius: 6px; 
  color: #cf222e; 
  font-size: 12px; 
  margin-bottom: 12px; 
}

@media (max-width: 768px) { 
  .playground.vertical { 
    flex-direction: column; 
    height: 800px; 
  }
  .playground.vertical .editor-pane,
  .playground.vertical .preview-pane {
    width: 100%;
    height: 50%;
  }
  .playground.vertical .editor-pane {
    border-right: none;
    border-bottom: 1px solid #30363d;
  }
}

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0969da;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
  border-radius: 0 0 4px 0;
}
.skip-link:focus {
  top: 0;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 分享模态框 */
.modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%; 
  background: rgba(0,0,0,0.5); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 1000; 
}

.modal { 
  background: #fff; 
  padding: 24px; 
  border-radius: 8px; 
  min-width: 400px; 
  max-width: 90vw;
}

.modal h3 { 
  margin: 0 0 16px 0; 
  font-size: 16px; 
}

.share-input { 
  width: 100%; 
  padding: 8px 12px; 
  border: 1px solid #d0d7de; 
  border-radius: 4px; 
  font-size: 13px; 
  font-family: monospace; 
  margin-bottom: 16px; 
}
.share-input:focus {
  outline: 2px solid #0969da;
  border-color: #0969da;
}

.modal-actions { 
  display: flex; 
  gap: 8px; 
  justify-content: flex-end; 
}

.btn-primary { 
  padding: 6px 16px; 
  background: #0969da; 
  color: #fff; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
}
.btn-primary:hover { background: #0550ae; }
.btn-primary:focus {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

.btn-secondary { 
  padding: 6px 16px; 
  background: #f6f8fa; 
  color: #24292f; 
  border: 1px solid #d0d7de; 
  border-radius: 4px; 
  cursor: pointer; 
}
.btn-secondary:hover { background: #f3f4f6; }
.btn-secondary:focus {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

.btn-share { 
  padding: 4px 8px; 
  background: #21262d; 
  border: 1px solid #30363d; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 12px; 
  color: #c9d1d9; 
}
.btn-share:hover { 
  background: #30363d; 
  border-color: #58a6ff; 
}

/* 导出菜单样式 */
.export-menu-wrapper { position: relative; }

.btn-export-primary { 
  padding: 4px 12px; 
  background: #0969da; 
  border: 1px solid #0969da; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 12px; 
  color: #fff; 
  transition: all 0.2s;
  font-weight: 500;
}
.btn-export-primary:hover { 
  background: #0550ae; 
  border-color: #0550ae;
}
.btn-export-primary:focus {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

.export-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
  min-width: 200px;
  z-index: 100;
  overflow: hidden;
  animation: dropdownSlide 0.15s ease-out;
}
@keyframes dropdownSlide {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.export-group { padding: 8px; }
.export-label {
  font-size: 11px;
  font-weight: 600;
  color: #656d76;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  margin-bottom: 4px;
}
.export-options { display: flex; flex-direction: column; gap: 2px; }

.export-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: background 0.15s;
  width: 100%;
}
.export-option:hover { 
  background: #f6f8fa; 
}
.export-option:focus {
  outline: 2px solid #0969da;
  outline-offset: -2px;
  background: #f6f8fa;
}

.export-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: #f6f8fa;
  border-radius: 6px;
}
.export-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.export-text strong {
  font-size: 13px;
  font-weight: 600;
  color: #1f2328;
}
.export-text small {
  font-size: 11px;
  color: #656d76;
}
.export-divider {
  height: 1px;
  background: #d0d7de;
  margin: 0;
}

/* Toast 提示 */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: #24292f;
  color: #fff;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 2000;
  opacity: 0;
  transition: all 0.3s ease;
}
.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .dot,
  .loading-dot,
  .toast,
  .export-dropdown,
  .btn-refresh .icon {
    animation: none;
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .playground {
    border-width: 2px;
  }
  .code-editor:focus,
  .btn-primary:focus,
  .btn-secondary:focus,
  .export-option:focus,
  .share-input:focus {
    outline-width: 3px;
  }
}

/* Focus visible for keyboard navigation */
button:focus-visible,
select:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid #0969da;
  outline-offset: 2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .export-dropdown {
    background: #161b22;
    border-color: #30363d;
  }
  .export-text strong {
    color: #c9d1d9;
  }
  .export-text small {
    color: #8b949e;
  }
}
</style>
