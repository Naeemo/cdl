# CDL 快速开始

## 什么是 CDL

CDL（Chart Definition Language）是一种用于定义数据图表的领域特定语言（DSL）。它的设计目标是：

- **像 Markdown 一样简单**：纯 Markdown 风格语法，3 行上手
- **安全**：不携带实际数据，只描述"怎么查、怎么画"
- **AI 友好**：结构化、可验证，易于 LLM 生成和修改
- **渐进增强**：简单图表 3 行，复杂图表逐层添加配置

---

## 基础语法

### 1. 定义图表（最简单）

```cdl
# 月度销售趋势

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line

@color #4fc3f7
@style smooth
```

### 2. 添加配置

```cdl
# 月度销售趋势

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line

## series
| field | as | color |
| --- | --- | --- |
| 销售额 | 销售额(万元) | #4fc3f7 |

## axis y
min: 0
max: 250
labelFormatter: "${value}万"

@title 2024年销售趋势
@interaction "tooltip:shared"
```

### 3. 使用 SQL 数据源

```cdl
```sql SalesData
SELECT month, SUM(amount) as total
FROM sales
WHERE year = 2024
GROUP BY month
```

# 月度销售
## line
use SalesData

@color #4fc3f7
```

---

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

---

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

---

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
# 月度销售

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line
`

const { file, errors } = compile(cdlSource)
if (errors.length === 0) {
    const { option } = render(file)
    // option 是标准的 ECharts 配置
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
```

---

## 下一步

- 查看详细 [语法规范](./syntax)
- 浏览 [示例代码](../examples/)
- 在线体验 [Playground](../playground/)
- 了解 [数据源配置](./data)

---

*文档版本：v0.7*