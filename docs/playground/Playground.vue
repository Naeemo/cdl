<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const cdlCode = ref(`@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
    4月,180
    5月,220
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y sales
    
    @style "平滑曲线"
    @color "#4fc3f7"
    @title "月度销售趋势"
}`)

const loading = ref(false)
const error = ref('')
const echartsOption = ref(null)
const chartRef = ref(null)
const selectedExample = ref('')
const isDirty = ref(false)
let chartInstance = null

const examples = [
  { name: 'line', label: '📈 折线' },
  { name: 'bar', label: '📊 柱状' },
  { name: 'pie', label: '🥧 饼图' },
  { name: 'scatter', label: '⚪ 散点' },
  { name: 'area', label: '🌊 面积' },
  { name: 'radar', label: '🕸️ 雷达' },
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
}`
}

let debounceTimer = null
watch(cdlCode, () => {
  isDirty.value = true
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

function refresh() {
  run()
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
  // Remove comments
  const cleanSource = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Parse Data block
  const dataRegex = /@lang\(data\)\s+(\w+)\s*\{([\s\S]*?)\}(?=\s*$|\s*\n\s*Chart)/
  const dataMatch = cleanSource.match(dataRegex)
  
  if (!dataMatch) {
    // Try simpler approach - find Data block by counting braces
    const dataStartIdx = cleanSource.indexOf('@lang(data)')
    if (dataStartIdx === -1) {
      return { success: false, error: '未找到数据定义' }
    }
    
    const nameMatch = cleanSource.slice(dataStartIdx).match(/@lang\(data\)\s+(\w+)\s*\{/)
    if (!nameMatch) {
      return { success: false, error: '数据定义格式错误' }
    }
    
    const dataName = nameMatch[1]
    const openBraceIdx = dataStartIdx + cleanSource.slice(dataStartIdx).indexOf('{')
    let braceCount = 1
    let closeIdx = openBraceIdx + 1
    
    while (braceCount > 0 && closeIdx < cleanSource.length) {
      if (cleanSource[closeIdx] === '{') braceCount++
      if (cleanSource[closeIdx] === '}') braceCount--
      if (braceCount > 0) closeIdx++
    }
    
    if (braceCount !== 0) {
      return { success: false, error: '数据定义不完整' }
    }
    
    const dataContent = cleanSource.slice(openBraceIdx + 1, closeIdx).trim()
    const lines = dataContent.split('\n').map(l => l.trim()).filter(l => l)
    
    if (lines.length < 2) {
      return { success: false, error: '数据需要表头和数据行' }
    }
    
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
    
    // Parse Chart block
    const chartIdx = cleanSource.indexOf('Chart', closeIdx)
    if (chartIdx === -1) {
      return { success: false, error: '未找到 Chart 定义' }
    }
    
    const chartOpenIdx = cleanSource.indexOf('{', chartIdx)
    if (chartOpenIdx === -1) {
      return { success: false, error: 'Chart 定义格式错误' }
    }
    
    let chartBraceCount = 1
    let chartCloseIdx = chartOpenIdx + 1
    
    while (chartBraceCount > 0 && chartCloseIdx < cleanSource.length) {
      if (cleanSource[chartCloseIdx] === '{') chartBraceCount++
      if (cleanSource[chartCloseIdx] === '}') chartBraceCount--
      if (chartBraceCount > 0) chartCloseIdx++
    }
    
    if (chartBraceCount !== 0) {
      return { success: false, error: 'Chart 定义不完整' }
    }
    
    const chartContent = cleanSource.slice(chartOpenIdx + 1, chartCloseIdx)
    
    const useMatch = chartContent.match(/use\s+(\w+)/)
    if (!useMatch || useMatch[1] !== dataName) {
      return { success: false, error: `Chart 必须使用数据源 ${dataName}` }
    }
    
    const typeMatch = chartContent.match(/type\s+(\w+)/)
    const chartType = typeMatch ? typeMatch[1] : 'line'
    
    const xMatch = chartContent.match(/x\s+(\w+)/)
    const yMatch = chartContent.match(/y\s+(\w+)/)
    
    return {
      success: true,
      data: { name: dataName, headers, rows },
      chart: {
        type: chartType,
        xField: xMatch?.[1] || headers[0],
        yField: yMatch?.[1] || headers[1] || headers[0],
        title: chartContent.match(/@title\s+"([^"]+)"/)?.[1],
        style: chartContent.match(/@style\s+"([^"]+)"/)?.[1],
        color: chartContent.match(/@color\s+"([^"]+)"/)?.[1]
      }
    }
  }
  
  // Original regex approach
  const dataName = dataMatch[1]
  const dataLines = dataMatch[2].trim().split('\n').map(l => l.trim()).filter(l => l)
  
  if (dataLines.length < 2) {
    return { success: false, error: '数据需要表头和数据行' }
  }
  
  const headers = dataLines[0].split(',').map(h => h.trim())
  const rows = dataLines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => {
      row[h] = isNaN(Number(values[i])) ? values[i] : Number(values[i])
    })
    return row
  })
  
  // Find Chart after Data
  const afterData = cleanSource.slice(cleanSource.indexOf(dataMatch[0]) + dataMatch[0].length)
  const chartMatch = afterData.match(/Chart\s+(?:\w+\s+)?\{([\s\S]*?)\}(?=\s*$|\s*\n)/)
  
  if (!chartMatch) {
    return { success: false, error: '未找到 Chart 定义' }
  }
  
  const chartContent = chartMatch[1]
  const useMatch = chartContent.match(/use\s+(\w+)/)
  
  if (!useMatch || useMatch[1] !== dataName) {
    return { success: false, error: `Chart 必须使用数据源 ${dataName}` }
  }
  
  const typeMatch = chartContent.match(/type\s+(\w+)/)
  const xMatch = chartContent.match(/x\s+(\w+)/)
  const yMatch = chartContent.match(/y\s+(\w+)/)
  
  return {
    success: true,
    data: { name: dataName, headers, rows },
    chart: {
      type: typeMatch?.[1] || 'line',
      xField: xMatch?.[1] || headers[0],
      yField: yMatch?.[1] || headers[1] || headers[0],
      title: chartContent.match(/@title\s+"([^"]+)"/)?.[1],
      style: chartContent.match(/@style\s+"([^"]+)"/)?.[1],
      color: chartContent.match(/@color\s+"([^"]+)"/)?.[1]
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
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  
  chartInstance.setOption(echartsOption.value, true)
}

onMounted(() => {
  run()
  window.addEventListener('resize', () => chartInstance?.resize())
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(echartsOption, () => nextTick(renderChart))
</script>

<template>
  <div class="playground">
    <div class="editor-pane">
      <div class="pane-header">
        <div class="header-left">
          <span class="title">CDL</span>
          <span v-if="isDirty" class="dot"></span>
        </div>
        <div class="header-actions">
          <select v-model="selectedExample" @change="loadExample" class="example-select">
            <option value="">示例</option>
            <option v-for="ex in examples" :key="ex.name" :value="ex.name">
              {{ ex.label }}
            </option>
          </select>
          <button class="btn-refresh" @click="refresh" title="重新渲染">
            <span class="icon">↻</span>
          </button>
        </div>
      </div>
      <textarea
        v-model="cdlCode"
        class="code-editor"
        placeholder="输入 CDL 代码..."
        spellcheck="false"
      />
    </div>
    
    <div class="preview-pane">
      <div class="pane-header">
        <span class="title">预览</span>
        <div v-if="loading" class="loading-dot"></div>
      </div>
      
      <div class="preview-content">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="echartsOption" ref="chartRef" class="chart-container"></div>
        <div v-else class="placeholder">输入 CDL 代码查看图表</div>
      </div>
    </div>
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

.editor-pane {
  width: 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #0d1117;
  border-right: 1px solid #30363d;
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

.btn-refresh .icon {
  display: inline-block;
  transition: transform 0.3s;
}

.btn-refresh:hover .icon { transform: rotate(180deg); }

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

.preview-pane {
  width: 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
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
  .playground {
    flex-direction: column;
    height: 800px;
  }
  
  .editor-pane,
  .preview-pane {
    width: 100%;
    height: 50%;
  }
  
  .editor-pane {
    border-right: none;
    border-bottom: 1px solid #30363d;
  }
}
</style>