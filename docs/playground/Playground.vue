<template>
  <div class="playground">
    <div class="editor-pane">
      <div class="pane-header">
        <span class="title">CDL</span>
        <button class="btn-run" @click="run" :disabled="loading">
          {{ loading ? '运行中...' : '▶ 运行' }}
        </button>
      </div>
      <textarea
        v-model="cdlCode"
        class="code-editor"
        placeholder="输入 CDL 代码..."
        spellcheck="false"
      />
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
          点击「运行」预览图表
        </div>
      </div>
    </div>
  </div>
</template>

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

function loadExample() {
  if (selectedExample.value && exampleCodes[selectedExample.value]) {
    cdlCode.value = exampleCodes[selectedExample.value]
    run()
  }
}

async function run() {
  loading.value = true
  error.value = ''
  
  try {
    // Mock compile and render (in real app, import from packages)
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
  // Parse Data block
  const dataMatch = source.match(/@lang\(data\)\s*\n(\w+)\s*\{([^}]+)\}/)
  if (!dataMatch) {
    return { success: false, error: '未找到数据定义，需要 @lang(data) DataName { ... }' }
  }
  
  const dataName = dataMatch[1]
  const dataContent = dataMatch[2].trim()
  const dataLines = dataContent.split('\n').map(l => l.trim()).filter(l => l)
  
  if (dataLines.length < 2) {
    return { success: false, error: '数据至少需要表头和一行数据' }
  }
  
  // Parse header and rows
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
  
  // Parse Chart block
  const chartMatch = source.match(/Chart\s+(?:\w+\s+)?\{([^}]+)\}/s)
  if (!chartMatch) {
    return { success: false, error: '未找到 Chart 定义' }
  }
  
  const chartContent = chartMatch[1]
  
  // Check use statement
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
  
  // Parse hints
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
  
  // Extract data for chart
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
  
  chartInstance.setOption(echartsOption.value, true) // true = not merge, replace
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

.editor-pane,
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
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
