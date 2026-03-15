# CDL 快速开始

## 什么是 CDL

CDL（Chart Definition Language）是一种用于定义数据图表的领域特定语言（DSL）。它的设计目标是：

- **简洁**：用最少的语法表达图表意图
- **安全**：不携带实际数据，只描述"怎么查、怎么画"
- **AI 友好**：结构化、可验证，易于 LLM 生成和修改
- **渐进式**：三种语法级别满足不同场景

## 基础语法

### 1. 定义数据源

```cdl
@lang(sql)
@source('sales_db')
SalesData {
    SELECT month, amount FROM sales_2024
}
```

### 2. 定义图表（快速语法）

```cdl
# 月度销售趋势

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## 折线图

@color "#4fc3f7"
@style "smooth"
```

### 3. 使用标准语法

```cdl
Chart 月度销售 {
    use SalesData
    type line
    x month
    y amount
    
    @style "平滑曲线"
    @color "#4fc3f7"
    @title "2024年销售趋势"
}
```

## 三种语法对比

| 特性 | 快速语法 | 标准语法 | 高级语法 |
|------|----------|----------|----------|
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 表达力 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 适用场景 | 新手、原型 | 生产环境 | 复杂图表 |
| 代码量 | 最少 | 适中 | 较多 |

**推荐**：
- 新手入门 → 快速语法
- 日常开发 → 标准语法
- 复杂图表（combo、多轴） → 高级语法

## 支持的图表类型

### 基础图表

- **line** - 折线图（趋势分析）
- **bar** - 柱状图（对比排名）
- **pie** - 饼图（占比构成）
- **scatter** - 散点图（关系分布）
- **area** - 面积图（累积趋势）
- **radar** - 雷达图（能力评估）

### 高级图表

- **combo** - 组合图（混合类型）
- **heatmap** - 热力图（矩阵密度）
- **gauge** - 仪表盘（进度指标）
- **candlestick** - 蜡烛图（金融K线）
- **boxplot** - 箱线图（统计分布）
- **sankey** - 桑基图（流向漏斗）
- **treemap** - 矩形树图（层次结构）
- **wordcloud** - 词云图（关键词频）
- **liquid** - 水波图（填充进度）
- **map** - 地图（地理分布）

## 自动类型推断

如果省略 `## 图表类型`，系统会根据标题关键词自动选择：

| 关键词 | 图表类型 | 示例 |
|--------|----------|------|
| 趋势、变化、增长、下降 | line | "销售趋势" → 折线图 |
| 对比、排名、分布 | bar | "产品销量排名" → 柱状图 |
| 占比、构成、百分比 | pie | "市场份额占比" → 饼图 |
| 关系、散点 | scatter | "身高体重关系" → 散点图 |
| 累积、面积、填充 | area | "累积用户数" → 面积图 |
| 能力、评估、多边形 | radar | "能力评估" → 雷达图 |
| 热力、矩阵、密度 | heatmap | "活跃热力图" → 热力图 |
| 组合、混合、双轴 | combo | "销售额与利润" → 组合图 |

## 安装使用

### 安装

```bash
npm install @cdl/compiler @cdl/renderer-echarts
```

### 基本使用

```typescript
import { compile } from '@cdl/compiler'
import { render } from '@cdl/renderer-echarts'

const cdlSource = `
@lang(data)
Sales {
    month, amount
    1月, 100
    2月, 150
    3月, 200
}

Chart 销售 {
    use Sales
    type line
    x month
    y amount
}
`

const { result, errors } = compile(cdlSource)
if (errors.length > 0) {
    console.error('编译错误:', errors)
} else {
    const { option } = render(result)
    // option 是标准的 ECharts 配置
    // 可直接传递给 ECharts 实例
}
```

### CLI 使用

```bash
# 安装全局 CLI
npm install -g @cdl/cli

# 验证语法
cdl validate example.cdl

# 编译输出 AST
cdl compile example.cdl --output ast.json

# 渲染并导出图片（需要 server）
cdl export example.cdl --format png --output chart.png
```

## 下一步

- 查看详细 [语法规范](./syntax)
- 浏览 [示例代码](../examples/)
- 在线体验 [Playground](../playground/)
- 了解 [数据源配置](./data)