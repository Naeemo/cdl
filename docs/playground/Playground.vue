<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

// ============ 内嵌 CDL Compiler (简化版) ============

function stripComments(source) {
  const lines = source.split('\n')
  const result = []
  let inBlock = false
  
  for (const raw of lines) {
    let line = ''
    let i = 0
    
    while (i < raw.length) {
      if (!inBlock && raw.slice(i, i + 2) === '/*') {
        inBlock = true
        i += 2
        continue
      }
      if (inBlock && raw.slice(i, i + 2) === '*/') {
        inBlock = false
        i += 2
        continue
      }
      if (inBlock) {
        i++
        continue
      }
      if (raw.slice(i, i + 2) === '//') break
      line += raw[i]
      i++
    }
    
    result.push(line)
  }
  
  return result.join('\n')
}

function parseTable(lines, start) {
  const headers = []
  const rows = []
  let i = start
  
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) break
    
    const cells = line.slice(1, -1).split('|').map(c => c.trim())
    if (cells.some(c => c.includes('---'))) {
      i++
      continue
    }
    
    if (headers.length === 0) headers.push(...cells)
    else rows.push(cells)
    
    i++
  }
  
  return headers.length ? { headers, rows, end: i } : null
}

const KEYWORD_MAP = {
  '趋势': 'line', '变化': 'line', '增长': 'line', '下降': 'line',
  '对比': 'bar', '排名': 'bar', '分布': 'bar',
  '占比': 'pie', '构成': 'pie',
  '关系': 'scatter', '散点': 'scatter',
  '累积': 'area', '面积': 'area',
  '能力': 'radar', '评估': 'radar',
  '热力': 'heatmap', '矩阵': 'heatmap',
  '组合': 'combo', '混合': 'combo', '双轴': 'combo',
  '仪表': 'gauge', '进度': 'gauge',
}

function inferType(title, explicit) {
  if (explicit) {
    return KEYWORD_MAP[explicit.trim()] || explicit.trim()
  }
  for (const [kw, type] of Object.entries(KEYWORD_MAP)) {
    if (title.includes(kw)) return type
  }
  return 'line'
}

function parseSeries(lines, start) {
  if (!lines[start].trim().startsWith('## series')) return null
  
  let i = start + 1
  let headers = []
  const series = []
  
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line.startsWith('|')) break
    
    const cells = line.slice(1, -1).split('|').map(c => c.trim())
    const cellsLower = cells.map(c => c.toLowerCase())
    
    if (cellsLower.some(c => c.includes('---'))) {
      i++
      continue
    }
    
    if (headers.length === 0) {
      headers = cellsLower
      if (!headers.includes('field')) return null
    } else {
      const row = {}
      headers.forEach((h, idx) => row[h] = cells[idx] || '')
      if (row.field) {
        series.push({
          field: row.field,
          as: row.as,
          type: row.type,
          color: row.color,
          axis: row.axis === 'right' ? 'right' : 'left',
          style: row.style,
        })
      }
    }
    
    i++
  }
  
  return series.length ? { series, end: i } : null
}

function parseAxis(lines, start) {
  const m = lines[start].trim().match(/^##\s+axis\s+(\w+)/)
  if (!m) return null
  
  let pos = m[1].toLowerCase()
  if (pos === 'top') pos = 'x2'
  if (pos === 'bottom') pos = 'y'
  if (pos === 'left') pos = 'y'
  if (pos === 'right') pos = 'y2'
  
  let i = start + 1
  const axis = { position: pos }
  
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    
    if (trimmed.startsWith('##') || trimmed.startsWith('#') || trimmed.startsWith('@')) break
    if (!trimmed) {
      i++
      continue
    }
    
    const kv = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*(.+)$/)
    if (kv) {
      const [, key, val] = kv
      switch (key) {
        case 'type': axis.type = val; break
        case 'min': axis.min = isNaN(Number(val)) ? val : Number(val); break
        case 'max': axis.max = isNaN(Number(val)) ? val : Number(val); break
        case 'tickCount': axis.tickCount = Number(val); break
        case 'labelFormatter': axis.labelFormatter = val; break
        case 'labelRotate': axis.labelRotate = Number(val); break
        case 'splitLine': axis.splitLine = val === 'true'; break
      }
    }
    
    i++
  }
  
  return { axis, end: i }
}

function parseInteraction(str) {
  const cfg = {}
  for (const part of str.split(/\s+/)) {
    const kv = part.match(/^(\w+):(.+)$/)
    if (!kv) continue
    const [, key, val] = kv
    switch (key) {
      case 'tooltip':
        if (['single', 'shared', 'none'].includes(val)) cfg.tooltip = val
        break
      case 'legend': cfg.legend = val === 'true'; break
      case 'zoom':
        if (val === 'true') cfg.zoom = true
        else if (['inside', 'slider'].includes(val)) cfg.zoom = val
        break
      case 'brush': cfg.brush = val === 'true'; break
    }
  }
  return cfg
}

function formatCSV(headers, rows) {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

function parseQuickChart(lines, start, errors) {
  let i = start
  
  const titleMatch = lines[i].trim().match(/^#\s+(.+)$/)
  if (!titleMatch) return null
  const title = titleMatch[1]
  i++
  
  while (i < lines.length && !lines[i].trim()) i++
  
  const table = parseTable(lines, i)
  if (!table) {
    errors.push({ line: i + 1, column: 0, message: 'Expected markdown table', severity: 'error' })
    return null
  }
  i = table.end
  
  while (i < lines.length && !lines[i].trim()) i++
  
  let chartType
  if (i < lines.length) {
    const typeLine = lines[i].trim()
    const typeMatch = typeLine.match(/^##\s+(.+)$/)
    if (typeMatch) {
      chartType = inferType(title, typeMatch[1])
      i++
    } else {
      chartType = inferType(title)
    }
  } else {
    chartType = inferType(title)
  }
  
  while (i < lines.length && !lines[i].trim()) i++
  
  const hints = {}
  const seriesList = []
  const axisList = []
  let hasSeries = false
  
  while (i < lines.length) {
    const line = lines[i].trim()
    
    if (line.startsWith('# ') || line === '---') break
    if (!line) {
      i++
      continue
    }
    
    const s = parseSeries(lines, i)
    if (s) {
      seriesList.push(...s.series)
      i = s.end
      hasSeries = true
      continue
    }
    
    const a = parseAxis(lines, i)
    if (a) {
      axisList.push(a.axis)
      i = a.end
      continue
    }
    
    const hintMatch = line.match(/^@(\w+)\s+(?:"([^"]*)"|'([^']*)'|(\S+))/)
    if (hintMatch) {
      const [, key, q1, q2, unq] = hintMatch
      const val = q1 || q2 || unq || ''
      if (key === 'interaction') hints.interaction = val
      else hints[key] = val
    }
    
    i++
  }
  
  const dataName = title + '_data'
  const dataDef = {
    type: 'data',
    name: dataName,
    lang: 'data',
    config: {},
    query: formatCSV(table.headers, table.rows),
  }
  
  const chart = {
    type: 'chart',
    name: title,
    chartType,
    dataSources: [dataName],
    hints,
  }
  
  if (!hasSeries) {
    chart.x = table.headers[0]
    chart.y = table.headers[1]
    if (table.headers.length >= 3) chart.group = table.headers[2]
  } else {
    chart.series = seriesList
  }
  
  if (axisList.length > 0) chart.axis = axisList
  
  if (hints.stack === 'true') chart.stack = true
  
  if (hints.interaction) {
    chart.interaction = parseInteraction(hints.interaction)
    delete hints.interaction
  }
  
  return { chart, dataDef, nextLine: i }
}

function compileCDL(source) {
  const errors = []
  const file = { data: [], charts: [] }
  
  const lines = source.split('\n')
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i].trim()
    
    if (!line || line === '---') {
      i++
      continue
    }
    
    if (line.startsWith('#')) {
      const result = parseQuickChart(lines, i, errors)
      if (result) {
        file.charts.push(result.chart)
        file.data.push(result.dataDef)
      }
      i = result ? result.nextLine : i + 1
      continue
    }
    
    i++
  }
  
  return { file, errors }
}

// ============ Playground 核心 ============
const editorRef = ref(null)
const chartRef = ref(null)
const editorTextarea = ref(null)
let chartInstance = null

// ============ 状态 ============
const code = ref('')
const isLoading = ref(false)
const errors = ref([])
const currentOption = ref(null)
const splitRatio = ref(0.5)
const isDragging = ref(false)
const activeTab = ref('preview')
const copied = ref(false)
const cursorPosition = ref({ line: 1, col: 1 })
const lineNumbers = ref([])

// ============ 示例代码 ============
const examples = [
  {
    id: 'combo',
    name: '组合图 (Combo)',
    code: `# 月度销售与利润分析

| 月份 | 销售额 | 利润 | 成本 |
| --- | --- | --- | --- |
| 1月 | 120 | 15 | 105 |
| 2月 | 150 | 20 | 130 |
| 3月 | 180 | 25 | 155 |
| 4月 | 220 | 32 | 188 |
| 5月 | 280 | 45 | 235 |
| 6月 | 350 | 58 | 292 |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #6366f1 | left | solid |
| 利润 | 利润(万元) | line | #f59e0b | right | smooth |
| 成本 | 成本(万元) | line | #ef4444 | left | dashed |

## axis y left
min: 0
max: 400
labelFormatter: "{value}万"

## axis y right
min: 0
max: 100
labelFormatter: "{value}%"

@interaction "tooltip:shared zoom:inside"
@color "#6366f1"`
  },
  {
    id: 'line',
    name: '平滑折线图',
    code: `# 用户增长趋势

| 月份 | 新增用户 | 活跃用户 |
| --- | --- | --- |
| 1月 | 1200 | 8500 |
| 2月 | 1850 | 9200 |
| 3月 | 2400 | 10500 |
| 4月 | 3200 | 12800 |
| 5月 | 4100 | 15200 |
| 6月 | 5300 | 18900 |

## line

@color "#10b981"
@style "smooth"
@title "2024年上半年用户增长"
@subtitle "数据来源：产品分析团队"`
  },
  {
    id: 'bar',
    name: '分组柱状图',
    code: `# 各区域销售业绩对比

| 区域 | Q1 | Q2 | Q3 |
| --- | --- | --- | --- |
| 华北 | 850 | 920 | 1100 |
| 华东 | 1200 | 1350 | 1480 |
| 华南 | 980 | 1150 | 1320 |
| 西南 | 650 | 780 | 950 |

## bar

@color "#8b5cf6"
@style "grouped"
@title "季度销售业绩"
@interaction "tooltip:shared"`
  },
  {
    id: 'pie',
    name: '环形饼图',
    code: `# 市场份额占比

| 产品 | 销量 |
| --- | --- |
| 旗舰版 | 3500 |
| 专业版 | 2800 |
| 标准版 | 4200 |
| 基础版 | 1900 |
| 定制版 | 850 |

## pie

@color "#ec4899"
@style "donut"
@title "产品销量分布"`
  },
  {
    id: 'area',
    name: '渐变面积图',
    code: `# 网站访问量趋势

| 日期 | PV | UV |
| --- | --- | --- |
| 周一 | 45000 | 12000 |
| 周二 | 52000 | 14500 |
| 周三 | 48000 | 13200 |
| 周四 | 61000 | 16800 |
| 周五 | 72000 | 21000 |
| 周六 | 58000 | 19500 |
| 周日 | 49000 | 15800 |

## area

@color "#06b6d4"
@style "gradient"
@title "一周访问趋势"
@interaction "zoom:slider"`
  },
  {
    id: 'radar',
    name: '雷达图',
    code: `# 能力评估模型

| 维度 | 当前 | 目标 |
| --- | --- | --- |
| 技术能力 | 85 | 90 |
| 沟通协作 | 78 | 85 |
| 项目管理 | 72 | 80 |
| 创新思维 | 88 | 90 |
| 业务理解 | 75 | 85 |
| 领导力 | 68 | 80 |

## radar

@color "#f97316"
@title "个人能力评估"
@subtitle "vs 目标值对比"`
  },
  {
    id: 'scatter',
    name: '散点图',
    code: `# 价格与销量关系

| 价格 | 销量 | 品类 |
| --- | --- | --- |
| 29 | 850 | 配件 |
| 49 | 720 | 配件 |
| 99 | 580 | 周边 |
| 199 | 420 | 周边 |
| 299 | 310 | 设备 |
| 499 | 180 | 设备 |
| 799 | 95 | 旗舰 |
| 1299 | 45 | 旗舰 |

## scatter

@color "#14b8a6"
@title "价格敏感度分析"
@interaction "tooltip:shared"`
  }
]

const currentExample = ref(examples[0])

// ============ 初始化 ============
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const codeParam = urlParams.get('code')
  
  if (codeParam) {
    try {
      code.value = decodeURIComponent(escape(atob(codeParam)))
    } catch (e) {
      code.value = examples[0].code
    }
  } else {
    code.value = examples[0].code
  }
  
  updateLineNumbers()
  
  await nextTick()
  initChart()
  compileAndRender()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

function handleResize() {
  chartInstance?.resize()
}

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value, 'dark')
}

// ============ 行号更新 ============
function updateLineNumbers() {
  const lines = code.value.split('\n').length
  lineNumbers.value = Array.from({ length: lines }, (_, i) => i + 1)
}

function updateCursorPosition() {
  const textarea = editorTextarea.value
  if (!textarea) return
  
  const text = textarea.value.substring(0, textarea.selectionStart)
  const lines = text.split('\n')
  cursorPosition.value = {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  }
}

// ============ 代码编辑 ============
function onCodeInput() {
  updateLineNumbers()
  compileAndRender()
}

function onCodeChange() {
  updateCursorPosition()
}

function onKeyDown(e) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = editorTextarea.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    if (e.shiftKey) {
      const before = code.value.substring(0, start)
      const after = code.value.substring(end)
      const lineStart = before.lastIndexOf('\n') + 1
      const lineContent = code.value.substring(lineStart, start)
      
      if (lineContent.startsWith('  ')) {
        code.value = code.value.substring(0, lineStart) + lineContent.substring(2) + after
        textarea.selectionStart = textarea.selectionEnd = start - 2
      }
    } else {
      code.value = code.value.substring(0, start) + '  ' + code.value.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + 2
    }
    
    onCodeInput()
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    compileAndRender()
  }
}

// ============ 编译与渲染 ============
let compileTimeout = null

function compileAndRender() {
  clearTimeout(compileTimeout)
  compileTimeout = setTimeout(() => {
    doCompile()
  }, 300)
}

function doCompile() {
  isLoading.value = true
  errors.value = []
  
  try {
    const result = compileCDL(stripComments(code.value))
    
    if (result.errors.length > 0) {
      errors.value = result.errors
    }
    
    if (result.file.charts.length > 0) {
      const option = transformToECharts(result.file)
      currentOption.value = option
      renderChart(option)
      if (errors.value.length === 0) {
        activeTab.value = 'preview'
      }
    } else if (result.errors.length > 0) {
      activeTab.value = 'errors'
    }
  } catch (e) {
    errors.value = [{ line: 1, column: 0, message: e.message, severity: 'error' }]
    activeTab.value = 'errors'
  } finally {
    isLoading.value = false
  }
}

// ============ CDL → ECharts 转换 ============
function transformToECharts(cdlFile) {
  const chart = cdlFile.charts[0]
  const dataDef = cdlFile.data.find(d => d.name === chart.dataSources[0])
  
  if (!dataDef) {
    throw new Error('未找到数据源')
  }
  
  const { headers, rows } = parseCSVData(dataDef.query)
  
  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    title: {
      text: chart.name || chart.hints?.title || '',
      subtext: chart.hints?.subtitle || '',
      left: 'center',
      top: 16,
      textStyle: {
        fontSize: 18,
        fontWeight: 500,
        color: '#e2e8f0'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#64748b'
      }
    },
    tooltip: {
      trigger: chart.chartType === 'pie' || chart.chartType === 'scatter' ? 'item' : 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0' },
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#475569' }
      }
    },
    legend: {
      show: true,
      bottom: 16,
      textStyle: { color: '#94a3b8' },
      itemGap: 20
    },
    grid: {
      left: 60,
      right: 60,
      top: 80,
      bottom: 80,
      containLabel: true
    },
    color: generateColors(chart.hints?.color)
  }
  
  switch (chart.chartType) {
    case 'line':
    case 'area':
      setupLineChart(option, chart, headers, rows)
      break
    case 'bar':
      setupBarChart(option, chart, headers, rows)
      break
    case 'pie':
      setupPieChart(option, chart, headers, rows)
      break
    case 'scatter':
      setupScatterChart(option, chart, headers, rows)
      break
    case 'radar':
      setupRadarChart(option, chart, headers, rows)
      break
    case 'combo':
      setupComboChart(option, chart, headers, rows)
      break
    default:
      setupLineChart(option, chart, headers, rows)
  }
  
  if (chart.interaction) {
    setupInteraction(option, chart.interaction)
  }
  
  return option
}

function parseCSVData(csv) {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => {
      const val = values[i]
      row[h] = isNaN(Number(val)) ? val : Number(val)
    })
    return row
  })
  return { headers, rows }
}

function generateColors(baseColor) {
  const palette = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#f59e0b', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
  ]
  
  if (baseColor) {
    return [baseColor, ...palette.filter(c => c !== baseColor)]
  }
  
  return palette
}

function setupLineChart(option, chart, headers, rows) {
  const xField = chart.x || headers[0]
  const yField = chart.y || headers[1]
  
  option.xAxis = {
    type: 'category',
    data: rows.map(r => r[xField]),
    axisLine: { lineStyle: { color: '#475569' } },
    axisLabel: { color: '#94a3b8' }
  }
  
  option.yAxis = {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#1e293b' } },
    axisLabel: { color: '#94a3b8' }
  }
  
  const isSmooth = chart.hints?.style?.includes('smooth')
  const isArea = chart.chartType === 'area' || chart.hints?.style?.includes('gradient')
  
  option.series = [{
    type: 'line',
    data: rows.map(r => r[yField]),
    smooth: isSmooth,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: { width: 3 },
    itemStyle: { borderWidth: 2, borderColor: '#fff' },
    areaStyle: isArea ? {
      opacity: 0.3,
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(99, 102, 241, 0.6)' },
        { offset: 1, color: 'rgba(99, 102, 241, 0.05)' }
      ])
    } : undefined
  }]
}

function setupBarChart(option, chart, headers, rows) {
  const xField = chart.x || headers[0]
  const yFields = headers.slice(1).filter(h => h !== xField)
  
  option.xAxis = {
    type: 'category',
    data: rows.map(r => r[xField]),
    axisLine: { lineStyle: { color: '#475569' } },
    axisLabel: { color: '#94a3b8' }
  }
  
  option.yAxis = {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#1e293b' } },
    axisLabel: { color: '#94a3b8' }
  }
  
  option.series = yFields.map((field) => ({
    name: field,
    type: 'bar',
    data: rows.map(r => r[field]),
    barMaxWidth: 40,
    itemStyle: { borderRadius: [4, 4, 0, 0] }
  }))
}

function setupPieChart(option, chart, headers, rows) {
  const nameField = chart.x || headers[0]
  const valueField = chart.y || headers[1]
  const isDonut = chart.hints?.style?.includes('donut')
  
  delete option.xAxis
  delete option.yAxis
  delete option.grid
  
  option.series = [{
    type: 'pie',
    radius: isDonut ? ['40%', '70%'] : '60%',
    center: ['50%', '50%'],
    data: rows.map(r => ({ name: r[nameField], value: r[valueField] })),
    itemStyle: {
      borderRadius: 6,
      borderColor: '#0f172a',
      borderWidth: 2
    },
    label: {
      color: '#94a3b8',
      formatter: '{b}: {c} ({d}%)'
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }]
}

function setupScatterChart(option, chart, headers, rows) {
  const xField = chart.x || headers[0]
  const yField = chart.y || headers[1]
  
  option.xAxis = {
    type: 'value',
    axisLine: { lineStyle: { color: '#475569' } },
    splitLine: { lineStyle: { color: '#1e293b' } },
    axisLabel: { color: '#94a3b8' }
  }
  
  option.yAxis = {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#1e293b' } },
    axisLabel: { color: '#94a3b8' }
  }
  
  option.series = [{
    type: 'scatter',
    data: rows.map(r => [r[xField], r[yField]]),
    symbolSize: 16,
    itemStyle: { opacity: 0.8 }
  }]
}

function setupRadarChart(option, chart, headers, rows) {
  const indicatorField = chart.x || headers[0]
  const seriesFields = headers.slice(1).filter(h => h !== indicatorField)
  const maxValue = Math.max(...rows.flatMap(r => seriesFields.map(f => r[f]))) * 1.2
  
  option.radar = {
    indicator: rows.map(r => ({ name: r[indicatorField], max: maxValue })),
    axisName: { color: '#94a3b8' },
    splitArea: { areaStyle: { color: ['rgba(30, 41, 59, 0.5)', 'rgba(15, 23, 42, 0.8)'] } },
    axisLine: { lineStyle: { color: '#475569' } },
    splitLine: { lineStyle: { color: '#334155' } }
  }
  
  option.series = [{
    type: 'radar',
    data: seriesFields.map((field, idx) => ({
      name: field,
      value: rows.map(r => r[field]),
      areaStyle: idx === 0 ? { opacity: 0.3 } : undefined
    }))
  }]
}

function setupComboChart(option, chart, headers, rows) {
  if (chart.series && chart.series.length > 0) {
    const xField = headers[0]
    option.xAxis = {
      type: 'category',
      data: rows.map(r => r[xField]),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94a3b8' }
    }
    
    const yAxes = []
    const hasRightAxis = chart.series.some(s => s.axis === 'right')
    
    const leftAxisConfig = chart.axis?.find(a => a.position === 'y' || a.position === 'left') || {}
    yAxes.push({
      type: 'value',
      position: 'left',
      min: leftAxisConfig.min,
      max: leftAxisConfig.max,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { 
        color: '#94a3b8',
        formatter: leftAxisConfig.labelFormatter || '{value}'
      }
    })
    
    if (hasRightAxis) {
      const rightAxisConfig = chart.axis?.find(a => a.position === 'y2' || a.position === 'right') || {}
      yAxes.push({
        type: 'value',
        position: 'right',
        min: rightAxisConfig.min,
        max: rightAxisConfig.max,
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { 
          color: '#94a3b8',
          formatter: rightAxisConfig.labelFormatter || '{value}'
        }
      })
    }
    
    option.yAxis = yAxes
    
    option.series = chart.series.map((s) => {
      const isLine = s.type === 'line'
      const yAxisIndex = s.axis === 'right' ? 1 : 0
      
      return {
        name: s.as || s.field,
        type: s.type || 'bar',
        yAxisIndex,
        data: rows.map(r => r[s.field]),
        smooth: s.style === 'smooth',
        lineStyle: s.style === 'dashed' ? { type: 'dashed', width: 2 } : { width: 2 },
        itemStyle: s.color ? { color: s.color } : undefined,
        symbol: isLine ? 'circle' : undefined,
        symbolSize: isLine ? 8 : undefined,
        barMaxWidth: 30
      }
    })
  } else {
    setupLineChart(option, chart, headers, rows)
  }
}

function setupInteraction(option, interaction) {
  if (interaction.zoom) {
    option.dataZoom = []
    if (interaction.zoom === true || interaction.zoom === 'inside') {
      option.dataZoom.push({ type: 'inside' })
    }
    if (interaction.zoom === 'slider') {
      option.dataZoom.push({ 
        type: 'slider',
        bottom: 50,
        height: 20,
        borderColor: '#334155',
        fillerColor: 'rgba(99, 102, 241, 0.2)',
        handleStyle: { color: '#6366f1' },
        textStyle: { color: '#94a3b8' }
      })
    }
  }
  
  if (interaction.brush) {
    option.brush = {
      toolbox: ['rect', 'polygon', 'clear'],
      brushStyle: {
        borderWidth: 1,
        color: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1'
      }
    }
  }
}

function renderChart(option) {
  if (!chartInstance) return
  chartInstance.setOption(option, true)
}

// ============ 拖拽调整大小 ============
function startDrag(e) {
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return
  const container = editorRef.value?.parentElement
  if (!container) return
  const rect = container.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  splitRatio.value = Math.max(0.2, Math.min(0.8, ratio))
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  chartInstance?.resize()
}

// ============ 工具函数 ============
function loadExample(example) {
  currentExample.value = example
  code.value = example.code
  updateLineNumbers()
  compileAndRender()
}

async function copyCode() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function downloadPNG() {
  if (!chartInstance) return
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#0f172a'
  })
  const link = document.createElement('a')
  link.download = 'cdl-chart.png'
  link.href = url
  link.click()
}

function shareCode() {
  const encoded = btoa(unescape(encodeURIComponent(code.value)))
  const url = new URL(window.location.href)
  url.searchParams.set('code', encoded)
  navigator.clipboard.writeText(url.toString())
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

// ============ 计算属性 ============
const hasErrors = computed(() => errors.value.length > 0)
const errorCount = computed(() => errors.value.filter(e => e.severity === 'error').length)
const warningCount = computed(() => errors.value.filter(e => e.severity === 'warning').length)
</script>

<template>
  <div class="playground">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-left">
        <div class="logo">
          <span class="logo-icon">◆</span>
          <span class="logo-text">CDL Playground</span>
        </div>
        
        <div class="example-selector">
          <select v-model="currentExample" @change="loadExample(currentExample)">
            <option v-for="ex in examples" :key="ex.id" :value="ex">
              {{ ex.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button class="btn-icon" :class="{ active: copied }" @click="copyCode" title="复制代码">
          <span>{{ copied ? '✓' : '⎘' }}</span>
        </button>
        <button class="btn-icon" @click="shareCode" title="分享链接">
          <span>⎋</span>
        </button>
        <div class="divider"></div>
        <button class="btn-primary" @click="downloadPNG">
          <span>⬇</span>
          导出 PNG
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="main" :style="{ gridTemplateColumns: `${splitRatio * 100}% 8px ${(1 - splitRatio) * 100}%` }">
      <!-- 编辑器 -->
      <div class="editor-panel" ref="editorRef">
        <div class="panel-header">
          <span class="panel-title">CDL</span>
          <div class="panel-actions">
            <span v-if="isLoading" class="status-indicator loading"></span>
            <span class="cursor-pos">Ln {{ cursorPosition.line }}, Col {{ cursorPosition.col }}</span>
          </div>
        </div>
        
        <div class="editor-wrapper">
          <div class="line-numbers">
            <div v-for="num in lineNumbers" :key="num" class="line-number">
              {{ num }}
            </div>
          </div>
          <textarea
            ref="editorTextarea"
            v-model="code"
            class="code-editor"
            spellcheck="false"
            @input="onCodeInput"
            @keyup="onCodeChange"
            @click="onCodeChange"
            @keydown="onKeyDown"
          />
        </div>
      </div>

      <!-- 拖拽分隔线 -->
      <div 
        class="resizer" 
        :class="{ dragging: isDragging }"
        @mousedown="startDrag"
      >
        <div class="resizer-handle"></div>
      </div>

      <!-- 预览面板 -->
      <div class="preview-panel">
        <div class="panel-header">
          <div class="tabs">
            <button 
              class="tab" 
              :class="{ active: activeTab === 'preview' }"
              @click="activeTab = 'preview'"
            >
              预览
            </button>
            <button 
              class="tab" 
              :class="{ active: activeTab === 'data', 'has-content': currentOption }"
              @click="activeTab = 'data'"
            >
              配置
            </button>
            <button 
              v-if="hasErrors"
              class="tab error" 
              :class="{ active: activeTab === 'errors' }"
              @click="activeTab = 'errors'"
            >
              错误
              <span class="badge">{{ errorCount }}</span>
            </button>
          </div>
        </div>
        
        <div class="panel-content">
          <!-- 预览 -->
          <div v-show="activeTab === 'preview'" class="chart-wrapper">
            <div ref="chartRef" class="chart-container"></div>
            <div v-if="isLoading" class="chart-overlay">
              <div class="spinner"></div>
            </div>
          </div>
          
          <!-- 配置数据 -->
          <div v-show="activeTab === 'data'" class="data-view">
            <pre v-if="currentOption">{{ JSON.stringify(currentOption, null, 2) }}</pre>
            <div v-else class="empty-state">
              <span class="empty-icon">📊</span>
              <p>输入 CDL 代码生成图表配置</p>
            </div>
          </div>
          
          <!-- 错误列表 -->
          <div v-show="activeTab === 'errors'" class="errors-view">
            <div v-for="(err, idx) in errors" :key="idx" class="error-item" :class="err.severity">
              <div class="error-location">
                第 {{ err.line }} 行{{ err.column > 0 ? `, 第 ${err.column} 列` : '' }}
              </div>
              <div class="error-message">{{ err.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <footer class="statusbar">
      <div class="status-left">
        <span v-if="currentExample">{{ currentExample.name }}</span>
      </div>
      <div class="status-right">
        <span v-if="hasErrors" class="status-error">
          {{ errorCount }} 错误{{ warningCount > 0 ? `, ${warningCount} 警告` : '' }}
        </span>
        <span v-else class="status-ok">✓ 编译成功</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ============ 基础变量 ============ */
.playground {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-hover: #475569;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent: #6366f1;
  --accent-hover: #4f46e5;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --border: #334155;
  
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

/* ============ 工具栏 ============ */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.logo-icon {
  color: var(--accent);
  font-size: 16px;
}

.logo-text {
  background: linear-gradient(90deg, var(--text-primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.example-selector select {
  padding: 6px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  min-width: 160px;
}

.example-selector select:hover {
  border-color: var(--bg-hover);
}

.example-selector select:focus {
  outline: none;
  border-color: var(--accent);
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--bg-hover);
}

.btn-icon.active {
  background: var(--success);
  border-color: var(--success);
  color: white;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

/* ============ 主内容区 ============ */
.main {
  display: grid;
  flex: 1;
  overflow: hidden;
}

/* ============ 面板通用 ============ */
.editor-panel,
.preview-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cursor-pos {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.loading {
  background: var(--accent);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ============ 编辑器 ============ */
.editor-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.line-numbers {
  width: 48px;
  padding: 12px 8px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  text-align: right;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 22px;
  color: var(--text-muted);
  overflow: hidden;
  user-select: none;
}

.line-number {
  height: 22px;
}

.code-editor {
  flex: 1;
  padding: 12px 16px;
  border: none;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 22px;
  resize: none;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.code-editor::placeholder {
  color: var(--text-muted);
}

.code-editor:focus {
  outline: none;
}

/* ============ 拖拽分隔线 ============ */
.resizer {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  cursor: col-resize;
  transition: background 0.15s;
  z-index: 10;
}

.resizer:hover,
.resizer.dragging {
  background: var(--accent);
}

.resizer-handle {
  width: 4px;
  height: 32px;
  background: var(--bg-hover);
  border-radius: 2px;
}

.resizer:hover .resizer-handle,
.resizer.dragging .resizer-handle {
  background: white;
}

/* ============ 预览面板 ============ */
.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 4px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab:hover {
  color: var(--text-secondary);
  background: var(--bg-tertiary);
}

.tab.active {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tab.error {
  color: var(--error);
}

.tab.error.active {
  background: rgba(239, 68, 68, 0.2);
}

.tab .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  margin-left: 4px;
  background: var(--error);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.panel-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

/* ============ 图表区域 ============ */
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.8);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============ 数据视图 ============ */
.data-view {
  padding: 16px;
  height: 100%;
  overflow: auto;
}

.data-view pre {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ============ 错误视图 ============ */
.errors-view {
  padding: 16px;
}

.error-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  border-left: 3px solid var(--error);
}

.error-item.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  border-left-color: var(--warning);
}

.error-location {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.error-message {
  font-size: 13px;
  color: var(--text-primary);
}

/* ============ 空状态 ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}

/* ============ 状态栏 ============ */
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  padding: 0 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
}

.status-ok {
  color: var(--success);
}

.status-error {
  color: var(--error);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .main {
    grid-template-columns: 100% !important;
    grid-template-rows: 50% 8px 50%;
  }
  
  .resizer {
    cursor: row-resize;
  }
  
  .resizer-handle {
    width: 32px;
    height: 4px;
  }
  
  .toolbar {
    flex-wrap: wrap;
    height: auto;
    padding: 8px;
  }
  
  .example-selector select {
    min-width: 120px;
  }
}
</style>