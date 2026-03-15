<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

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
})

onUnmounted(() => {
  window.removeEventListener('resize', checkBreakpoint)
})

const toggleLayout = () => {
  layoutMode.value = layoutMode.value === 'horizontal' ? 'vertical' : 'horizontal'
  localStorage.setItem('cdl-playground-layout', layoutMode.value)
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
labelFormatter: "${value}%"

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

const examples = [
  { name: 'line', label: '📈 折线' },
  { name: 'bar', label: '📊 柱状' },
  { name: 'pie', label: '🥧 饼图' },
  { name: 'scatter', label: '⚪ 散点' },
  { name: 'area', label: '🌊 面积' },
  { name: 'radar', label: '🕸️ 雷达' },
  { name: 'combo', label: '🔀 组合图(v0.6)' },
  { name: 'multi-axis', label: '📏 多轴(v0.6)' },
  { name: 'interaction', label: '🎮 交互(v0.6)' }
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
    run()
  }
  reader.readAsText(file)
}

function refresh() {
  run()
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
  } else {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
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
      formatter: (params) => `${chart.xField}: ${params.data[0]}<br/>${chart.yField}: ${params.data[1]}`
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
}

function copyShareLink() {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    alert('链接已复制到剪贴板！')
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
    alert('iframe 嵌入代码已复制！')
  })
}
function exportPNG() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })
  download(url, 'chart.png')
}

function exportSVG() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({
    type: 'svg',
    pixelRatio: 2
  })
  download(url, 'chart.svg')
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
})

watch(echartsOption, () => nextTick(renderChart))
</script>

<template>
  <div class="playground" :class="layoutMode">
    <div class="editor-pane">
      <div class="pane-header">
        <div class="header-left">
          <span class="title">CDL</span>
          <span v-if="isDirty" class="dot"></span>
          <button class="btn-layout" @click="toggleLayout" :title="layoutMode === 'horizontal' ? '切换为垂直布局' : '切换为水平布局'">
            {{ layoutMode === 'horizontal' ? '🔀' : '📱' }}
          </button>
        </div>
        <div class="header-actions">
          <input type="file" accept=".csv" @change="handleCSVUpload" class="file-input" title="上传 CSV" />
          <button 
            class="btn-auto-refresh" 
            :class="{ active: autoRefresh }"
            @click="toggleAutoRefresh" 
            :title="autoRefresh ? '停止自动刷新' : '开启自动刷新(5s)'"
          >
            {{ autoRefresh ? '⏸' : '▶' }}
          </button>
          <button class="btn-share" @click="generateShareLink" title="分享链接">🔗</button>
          <select v-model="selectedExample" @change="loadExample" class="example-select">
            <option v-for="ex in examples" :key="ex.name" :value="ex.name">{{ ex.label }}</option>
          </select>
          <button class="btn-refresh" @click="refresh" title="重新渲染"><span class="icon">↻</span></button>
        </div>
      </div>
      <textarea v-model="cdlCode" class="code-editor" placeholder="输入 CDL 代码...或粘贴 CSV" spellcheck="false" @paste="handlePaste" />
    </div>

    <div class="preview-pane">
      <div class="pane-header">
        <span class="title">预览</span>
        <div class="header-actions">
          <button class="btn-export" @click="exportPNG" title="导出 PNG">PNG</button>
          <button class="btn-export" @click="exportSVG" title="导出 SVG">SVG</button>
          <button class="btn-export" @click="generateEmbedCode" title="嵌入代码">Embed</button>
          <div v-if="loading" class="loading-dot"></div>
        </div>
      </div>
      <div class="preview-content">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="echartsOption" ref="chartRef" class="chart-container"></div>
        <div v-else class="placeholder">输入 CDL 代码查看图表</div>
      </div>
    </div>
  </div>

  <!-- 分享模态框 -->
  <div v-if="showShareModal" class="modal-overlay" @click="closeShareModal">
    <div class="modal" @click.stop>
      <h3>🔗 分享链接</h3>
      <input type="text" :value="shareUrl" readonly class="share-input" />
      <div class="modal-actions">
        <button class="btn-primary" @click="copyShareLink">复制链接</button>
        <button class="btn-secondary" @click="closeShareModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.playground { display: flex; width: 100%; height: 600px; background: #0d1117; border-radius: 8px; overflow: hidden; border: 1px solid #30363d; }
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
.pane-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #161b22; border-bottom: 1px solid #30363d; height: 40px; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 8px; }
.title { font-weight: 600; font-size: 12px; color: #c9d1d9; text-transform: uppercase; letter-spacing: 0.5px; }
.dot { width: 6px; height: 6px; background: #58a6ff; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.header-actions { display: flex; align-items: center; gap: 6px; }
.btn-layout { padding: 4px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 12px; color: #c9d1d9; transition: all 0.2s; }
.btn-layout:hover { background: #30363d; border-color: #58a6ff; }
.file-input { padding: 4px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; font-size: 11px; color: #c9d1d9; cursor: pointer; max-width: 90px; }
.file-input:hover { border-color: #58a6ff; }
.example-select { padding: 4px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; font-size: 12px; color: #c9d1d9; cursor: pointer; outline: none; }
.example-select:hover { border-color: #58a6ff; }
.btn-auto-refresh { padding: 4px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 12px; color: #c9d1d9; transition: all 0.2s; }
.btn-auto-refresh:hover { background: #30363d; border-color: #58a6ff; }
.btn-auto-refresh.active { background: #238636; border-color: #238636; }
.btn-refresh { padding: 4px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 13px; color: #c9d1d9; transition: all 0.2s; }
.btn-refresh:hover { background: #30363d; border-color: #58a6ff; }
.btn-refresh .icon { display: inline-block; transition: transform 0.3s; }
.btn-refresh:hover .icon { transform: rotate(180deg); }
.btn-export { padding: 4px 10px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 11px; color: #c9d1d9; transition: all 0.2s; }
.btn-export:hover { background: #30363d; border-color: #58a6ff; }
.preview-pane .btn-export { background: #f6f8fa; border-color: #d0d7de; color: #24292f; }
.preview-pane .btn-export:hover { background: #fff; border-color: #0969da; }
.code-editor { flex: 1; padding: 12px; border: none; outline: none; font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace; font-size: 13px; line-height: 1.5; resize: none; background: #0d1117; color: #c9d1d9; tab-size: 4; min-height: 0; }
.code-editor::placeholder { color: #484f58; }
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
.preview-pane .pane-header { background: #f6f8fa; border-bottom: 1px solid #d0d7de; }
.preview-pane .title { color: #24292f; }
.loading-dot { width: 6px; height: 6px; background: #0969da; border-radius: 50%; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
.preview-content { flex: 1; padding: 16px; overflow: auto; display: flex; flex-direction: column; min-height: 0; }
.chart-container { flex: 1; min-height: 200px; width: 100%; }
.placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: #8c959f; font-size: 13px; }
.error-message { padding: 12px; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; color: #cf222e; font-size: 12px; margin-bottom: 12px; }
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

/* 分享模态框 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; padding: 24px; border-radius: 8px; min-width: 400px; }
.modal h3 { margin: 0 0 16px 0; font-size: 16px; }
.share-input { width: 100%; padding: 8px 12px; border: 1px solid #d0d7de; border-radius: 4px; font-size: 13px; font-family: monospace; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-primary { padding: 6px 16px; background: #0969da; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-primary:hover { background: #0550ae; }
.btn-secondary { padding: 6px 16px; background: #f6f8fa; color: #24292f; border: 1px solid #d0d7de; border-radius: 4px; cursor: pointer; }
.btn-secondary:hover { background: #f3f4f6; }
.btn-share { padding: 4px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 12px; color: #c9d1d9; }
.btn-share:hover { background: #30363d; border-color: #58a6ff; }
</style>