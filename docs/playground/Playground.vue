<template>
  <div class="playground">
    <div class="left-panel">
      <!-- Natural Language Input -->
      <div class="nl-section">
        <div class="pane-header">
          <span class="title">🤖 自然语言生成</span>
        </div>
        <div class="nl-input-area">
          <input
            v-model="nlInput"
            class="nl-input"
            placeholder="描述你想要的图表，例如：最近6个月销售额折线图，蓝色..."
            @keyup.enter="generateFromNL"
          />
          <button 
            class="btn-generate" 
            @click="generateFromNL" 
            :disabled="nlLoading || !nlInput.trim()"
          >
            {{ nlLoading ? '生成中...' : '✨ 生成 CDL' }}
          </button>
        </div>
        <div v-if="nlError" class="nl-error">{{ nlError }}</div>
      </div>

      <!-- CDL Editor -->
      <div class="editor-pane">
        <div class="pane-header">
          <span class="title">CDL</span>
          <div class="header-actions">
            <button class="btn-secondary" @click="clearCode">清空</button>
            <button class="btn-run" @click="run" :disabled="loading">
              {{ loading ? '运行中...' : '▶ 运行' }}
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
    </div>
    
    <div class="divider" />
    
    <div class="preview-pane">
      <div class="pane-header">
        <span class="title">预览</span>
        <select v-model="selectedExample" @change="loadExample" class="example-select">
          <option value="">选择示例...</option>
          <option v-for="ex in examples" :key="ex.name" :value="ex.name">
            {{ ex.label }}
          </option>
        </select>
      </div>
      
      <div class="preview-content">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-else-if="echartsOption" ref="chartRef" class="chart-container" />
        <div v-else class="placeholder">
          点击「运行」预览图表<br/>
          或输入自然语言描述生成 CDL
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// Natural Language
const nlInput = ref('')
const nlLoading = ref(false)
const nlError = ref('')

// CDL Editor
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
let chartInstance = null

const examples = [
  { name: 'line', label: '📈 折线图' },
  { name: 'bar', label: '📊 柱状图' },
  { name: 'pie', label: '🥧 饼图' },
  { name: 'scatter', label: '⚪ 散点图' },
  { name: 'area', label: '🌊 面积图' },
  { name: 'radar', label: '🕸️ 雷达图' },
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

function clearCode() {
  cdlCode.value = ''
}

function loadExample() {
  if (selectedExample.value && exampleCodes[selectedExample.value]) {
    cdlCode.value = exampleCodes[selectedExample.value]
    run()
  }
}

// Natural Language to CDL Generation
async function generateFromNL() {
  if (!nlInput.value.trim()) return
  
  nlLoading.value = true
  nlError.value = ''
  
  try {
    const generated = await mockNLToCDL(nlInput.value.trim())
    cdlCode.value = generated
    // Auto run after generation
    await run()
  } catch (e) {
    nlError.value = e.message || '生成失败'
  } finally {
    nlLoading.value = false
  }
}

// Mock NL to CDL conversion (in real app, would call API)
async function mockNLToCDL(description) {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 500))
  
  const desc = description.toLowerCase()
  
  // Simple pattern matching for demo
  if (desc.includes('饼') || desc.includes('占比') || desc.includes('比例')) {
    const isRing = desc.includes('环')
    return `@lang(data)
CategoryData {
    category,value
    类别A,35
    类别B,25
    类别C,20
    类别D,20
}

Chart 数据分布 {
    use CategoryData
    type pie
    x category
    y value
    ${isRing ? '@style "环形"' : ''}
    @title "${description.slice(0, 20)}"
}`
  }
  
  if (desc.includes('柱') || desc.includes('条')) {
    return `@lang(data)
RegionData {
    region,sales
    华北,120
    华南,200
    华东,180
    华西,150
}

Chart 区域对比 {
    use RegionData
    type bar
    x region
    y sales
    @title "${description.slice(0, 20)}"
}`
  }
  
  if (desc.includes('散点') || desc.includes('分布')) {
    return `@lang(data)
ScatterData {
    x,y
    10,20
    20,35
    30,30
    40,45
    50,40
}

Chart 散点分布 {
    use ScatterData
    type scatter
    x x
    y y
    @title "${description.slice(0, 20)}"
}`
  }
  
  if (desc.includes('雷达') || desc.includes('能力') || desc.includes('评分')) {
    return `@lang(data)
RadarData {
    dimension,score
    技术,85
    沟通,75
    管理,80
    创新,90
    执行,70
}

Chart 能力评估 {
    use RadarData
    type radar
    x dimension
    y score
    @title "${description.slice(0, 20)}"
}`
  }
  
  if (desc.includes('面积') || desc.includes('区域')) {
    return `@lang(data)
TrendData {
    month,value
    1月,100
    2月,120
    3月,150
    4月,140
    5月,180
    6月,200
}

Chart 趋势面积 {
    use TrendData
    type area
    x month
    y value
    @style "渐变填充"
    @title "${description.slice(0, 20)}"
}`
  }
  
  // Default to line chart
  const isSmooth = desc.includes('平滑') || desc.includes('曲线')
  const color = desc.includes('蓝') ? '#4fc3f7' : 
                desc.includes('红') ? '#ef5350' : 
                desc.includes('绿') ? '#66bb6a' : '#4fc3f7'
  
  return `@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,120
    4月,180
    5月,200
    6月,220
}

Chart 销售趋势 {
    use SalesData
    type line
    x month
    y sales
    ${isSmooth ? '@style "平滑曲线"' : ''}
    @color "${color}"
    @title "${description.slice(0, 20)}"
}`
}

async function run() {
  loading.value = true
  error.value = ''
  
  try {
    const result = mockCompile(cdlCode.value)
    if (!result.success) {
      error.value = result.error
      echartsOption.value = null
      return
    }
    
    const renderResult = mockRender(result.ast)
    if (!renderResult.success) {
      error.value = renderResult.error
      echartsOption.value = null
      return
    }
    
    echartsOption.value = renderResult.option
    
    await nextTick()
    renderChart()
  } catch (e) {
    error.value = e.message
    echartsOption.value = null
  } finally {
    loading.value = false
  }
}

function mockCompile(source) {
  const dataMatch = source.match(/@lang\(data\)\s+(\w+)\s*\{([^}]+)\}/)
  if (!dataMatch) {
    return { success: false, error: '未找到数据定义，需要 @lang(data) DataName { ... }' }
  }
  
  const dataName = dataMatch[1]
  const dataContent = dataMatch[2].trim()
  const dataLines = dataContent.split('\n').map(l => l.trim()).filter(l => l)
  
  if (dataLines.length < 2) {
    return { success: false, error: '数据至少需要表头和一行数据' }
  }
  
  const headers = dataLines[0].split(',').map(h => h.trim())
  const rows = dataLines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => {
      const val = values[i]
      row[h] = isNaN(Number(val)) ? val : Number(val)
    })
    return row
  })
  
  const chartMatch = source.match(/Chart\s+(?:\w+\s+)?\{([^}]+)\}/s)
  if (!chartMatch) {
    return { success: false, error: '未找到 Chart 定义' }
  }
  
  const chartContent = chartMatch[1]
  
  const useMatch = chartContent.match(/use\s+(\w+)/)
  if (!useMatch || useMatch[1] !== dataName) {
    return { success: false, error: `Chart 必须使用数据源 ${dataName}` }
  }
  
  const typeMatch = chartContent.match(/type\s+(\w+)/)
  const chartType = typeMatch ? typeMatch[1] : 'line'
  
  const xMatch = chartContent.match(/x\s+(\w+)/)
  const yMatch = chartContent.match(/y\s+(\w+)/)
  
  const xField = xMatch?.[1] || headers[0]
  const yField = yMatch?.[1] || headers[1] || headers[0]
  
  const titleMatch = source.match(/@title\s+"([^"]+)"/)
  const styleMatch = source.match(/@style\s+"([^"]+)"/)
  const colorMatch = source.match(/@color\s+"([^"]+)"/)
  
  return {
    success: true,
    ast: {
      dataName,
      headers,
      rows,
      chartType,
      xField,
      yField,
      hints: {
        title: titleMatch?.[1],
        style: styleMatch?.[1],
        color: colorMatch?.[1]
      }
    }
  }
}

function mockRender(ast) {
  const { rows, xField, yField, chartType, hints } = ast
  
  const xData = rows.map(r => r[xField])
  const yData = rows.map(r => r[yField])
  
  const option = {
    animation: true,
    title: hints?.title ? { text: hints.title, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: xData 
    },
    yAxis: { type: 'value' },
    series: [{
      type: chartType === 'area' ? 'line' : chartType,
      data: yData,
      smooth: hints?.style?.includes('平滑'),
      areaStyle: chartType === 'area' ? {} : undefined
    }],
    color: hints?.color ? [hints.color] : undefined
  }
  
  if (chartType === 'pie') {
    delete option.xAxis
    delete option.yAxis
    delete option.grid
    option.series = [{
      type: 'pie',
      radius: hints?.style?.includes('环形') ? ['40%', '70%'] : '60%',
      data: rows.map(r => ({ 
        name: r[xField], 
        value: r[yField] 
      }))
    }]
    option.tooltip = { trigger: 'item' }
  }
  
  if (chartType === 'radar') {
    delete option.xAxis
    delete option.yAxis
    const maxValue = Math.max(...yData) * 1.2
    option.radar = {
      indicator: rows.map(r => ({ 
        name: r[xField], 
        max: maxValue 
      }))
    }
    option.series = [{
      type: 'radar',
      data: [{ 
        value: rows.map(r => r[yField]), 
        name: yField 
      }]
    }]
  }
  
  if (chartType === 'scatter') {
    option.series = [{
      type: 'scatter',
      data: rows.map(r => [r[xField], r[yField]]),
      symbolSize: 15
    }]
    option.tooltip = {
      formatter: (params) => {
        return `${xField}: ${params.data[0]}<br/>${yField}: ${params.data[1]}`
      }
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
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(echartsOption, () => {
  nextTick(renderChart)
})
</script>

<style scoped>
.playground {
  display: flex;
  height: calc(100vh - 64px);
  background: #f5f5f5;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.nl-section {
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nl-section .pane-header {
  background: transparent;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  color: white;
}

.nl-section .title {
  color: white;
}

.nl-input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

.nl-input {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  background: rgba(255,255,255,0.95);
  color: #333;
  outline: none;
}

.nl-input::placeholder {
  color: #999;
}

.btn-generate {
  padding: 10px 20px;
  background: #4fc3f7;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-generate:hover {
  background: #29b6f6;
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nl-error {
  padding: 8px 16px;
  color: #ffccc7;
  font-size: 13px;
  background: rgba(255,0,0,0.2);
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-height: 0;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  padding: 6px 12px;
  background: #f0f0f0;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-run {
  padding: 6px 16px;
  background: #4fc3f7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-run:hover {
  background: #29b6f6;
}

.btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.example-select {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.code-editor {
  flex: 1;
  padding: 16px;
  border: none;
  outline: none;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: #fafafa;
  color: #333;
}

.divider {
  width: 4px;
  background: #e8e8e8;
  cursor: col-resize;
}

.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999;
  font-size: 14px;
  text-align: center;
  line-height: 1.8;
}

.error-message {
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 13px;
}
</style>
