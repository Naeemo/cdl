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
import { ref, onMounted, watch, nextTick } from 'vue'
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
  echartsOption.value = null
  
  try {
    // Mock compile and render (in real app, import from packages)
    const result = mockCompile(cdlCode.value)
    if (!result.success) {
      error.value = result.error
      return
    }
    
    const renderResult = mockRender(result.ast)
    if (!renderResult.success) {
      error.value = renderResult.error
      return
    }
    
    echartsOption.value = renderResult.option
    
    await nextTick()
    renderChart()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function mockCompile(source) {
  // Simple mock compile
  const hasData = source.includes('@lang')
  const hasChart = source.includes('Chart')
  
  if (!hasData || !hasChart) {
    return { success: false, error: '需要 Data 和 Chart 定义' }
  }
  
  const typeMatch = source.match(/type\s+(\w+)/)
  const chartType = typeMatch ? typeMatch[1] : 'line'
  
  const xMatch = source.match(/x\s+(\w+)/)
  const yMatch = source.match(/y\s+(\w+)/)
  
  const titleMatch = source.match(/@title\s+"([^"]+)"/)
  const styleMatch = source.match(/@style\s+"([^"]+)"/)
  const colorMatch = source.match(/@color\s+"([^"]+)"/)
  
  return {
    success: true,
    ast: {
      chartType,
      x: xMatch?.[1] || 'x',
      y: yMatch?.[1] || 'y',
      hints: {
        title: titleMatch?.[1],
        style: styleMatch?.[1],
        color: colorMatch?.[1]
      }
    }
  }
}

function mockRender(ast) {
  const option = {
    animation: true,
    title: ast.hints?.title ? { text: ast.hints.title, left: 'center' } : undefined,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
    yAxis: { type: 'value' },
    series: [{
      type: ast.chartType === 'area' ? 'line' : ast.chartType,
      data: [120, 200, 150, 80, 70],
      smooth: ast.hints?.style?.includes('平滑'),
      areaStyle: ast.chartType === 'area' ? {} : undefined
    }],
    color: ast.hints?.color ? [ast.hints.color] : undefined
  }
  
  if (ast.chartType === 'pie') {
    delete option.xAxis
    delete option.yAxis
    delete option.grid
    option.series = [{
      type: 'pie',
      radius: ast.hints?.style?.includes('环形') ? ['40%', '70%'] : '60%',
      data: [
        { value: 1048, name: 'A' },
        { value: 735, name: 'B' },
        { value: 580, name: 'C' }
      ]
    }]
    option.tooltip = { trigger: 'item' }
  }
  
  if (ast.chartType === 'radar') {
    delete option.xAxis
    delete option.yAxis
    option.radar = {
      indicator: [
        { name: 'A', max: 100 },
        { name: 'B', max: 100 },
        { name: 'C', max: 100 },
        { name: 'D', max: 100 }
      ]
    }
    option.series = [{
      type: 'radar',
      data: [{ value: [80, 90, 70, 85], name: '数据' }]
    }]
  }
  
  return { success: true, option }
}

function renderChart() {
  if (!chartRef.value || !echartsOption.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(echartsOption.value)
}

onMounted(() => {
  run()
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
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
