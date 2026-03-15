# CDL 语法规范 v0.6

## 概述

CDL（Chart Definition Language）是用于定义数据图表的领域特定语言（DSL）。设计目标：

- **简洁声明式**：像写 Markdown 一样简单
- **AI 友好**：结构化、可验证，便于 LLM 生成和修改
- **安全交付**：DSL 不携带数据，权限和数据留在服务端
- **渐进渲染**：核心层必渲染，提示层可选解析
- **ECharts 极简映射**：舍弃不高频配置，保留核心能力

---

## 三种语法级别

### 1. 快速语法（Markdown 风格）— 推荐新手

```cdl
# 月度销售额

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## 折线图

@color "#4fc3f7"
@style "smooth"
```

**自动映射**：
- 第一列 → x 轴
- 第二列 → y 轴
- 标题关键词 → 图表类型（"趋势"→line，"对比"→bar，"占比"→pie）

---

### 2. 标准语法（显式声明）— 推荐生产

```cdl
Chart 月度销售趋势 {
    use SalesData
    type line
    x month
    y total
    
    @color "#4fc3f7"
    @title "2024年销售趋势"
}
```

---

### 3. 高级语法（多系列 + 坐标轴 + 交互）— v0.6 新增

```cdl
# 销售额与利润分析

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |
| 3月 | 180 | 25 |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left | solid |
| 利润 | 利润(万元) | line | #ff9800 | right | smooth |

## axis x
labelRotate: 45

## axis y left
min: 0
max: 200
labelFormatter: "${value}万"

## axis y right
min: 0
max: 50
labelFormatter: "${value}%"

@interaction "tooltip:shared zoom:inside"
```

---

## 数据源定义

### 内联数据（data）

```cdl
@lang(data)
Sales {
    month, amount
    1月, 100
    2月, 150
}
```

### SQL 查询

```cdl
@lang(sql)
@source('sales_db')   # 必需：数据源连接名
@timeout(30)          # 可选：超时（秒）
@cache(300)           # 可选：缓存（秒）
SalesData {
    SELECT month, amount FROM sales
}
```

### DAX 查询

```cdl
@lang(dax)
@source('powerbi_dataset')
Revenue {
    EVALUATE SUMMARIZE(Sales, Sales[Month], "Revenue", SUM(Sales[Amount]))
}
```

---

## 图表类型

| 类型 | 说明 | 触发关键词（自动推断） |
|------|------|----------------------|
| `line` | 折线图 | 趋势、变化、增长、下降 |
| `bar` | 柱状图 | 对比、排名、分布、数量 |
| `pie` | 饼图 | 占比、构成、百分比 |
| `scatter` | 散点图 | 关系、分布、散点 |
| `area` | 面积图 | 累积、面积、填充 |
| `radar` | 雷达图 | 能力、评估、多边形 |
| `heatmap` | 热力图 | 热力、矩阵、密度 |
| `combo` | 组合图 | 组合、混合、双轴 |
| `gauge` | 仪表盘 | 仪表、进度、达标 |
| `candlestick` | 蜡烛图 | 金融K线 |
| `boxplot` | 箱线图 | 统计分布 |
| `sankey` | 桑基图 | 流向、漏斗 |
| `treemap` | 矩形树图 | 层次结构 |
| `wordcloud` | 词云图 | 关键词频 |
| `liquid` | 水波图 | 填充进度 |
| `map` | 地图 | 地理分布 |

---

## 提示层指令（`@` 前缀）

| 指令 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `@color` | string | 主色调（HEX） | `@color "#4fc3f7"` |
| `@style` | string | 样式 | `@style "smooth"` |
| `@animation` | string | 动画 | `@animation "ease-out"` |
| `@title` | string | 标题（覆盖默认） | `@title "自定义标题"` |
| `@subtitle` | string | 副标题 | `@subtitle "2024年数据"` |
| `@layout` | string | 布局 | `@layout "compact"` |
| `@theme` | `light`\|`dark`\|`auto` | 主题 | `@theme "dark"` |
| `@grid` | boolean | 显示网格 | `@grid false` |
| `@interaction` | string | 交互（见下文） | `@interaction "tooltip:shared"` |

---

## 高级特性（v0.6 新增）

### 系列配置（`## series`）

用于多系列图表（combo、分组柱状图等）精细控制每个系列。

```cdl
## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left | solid |
| 利润 | 利润(万元) | line | #ff9800 | right | smooth |
```

**字段说明**：
- `field`：数据列名（必需）
- `as`：系列显示名称
- `type`：系列类型（combo 图可混合 bar/line）
- `color`：HEX 颜色
- `axis`：坐标轴 `left` / `right`
- `style`：`solid` / `dashed` / `smooth` / `marker`

---

### 坐标轴配置（`## axis <position>`）

```cdl
## axis x
type: category
labelRotate: 45

## axis y left
min: 0
max: 200
tickCount: 5
labelFormatter: "${value}万"
splitLine: true
```

**位置**：`x`、`y`、`y2`（右轴）、`x2`（顶轴）或 `left`/`right`/`top`/`bottom`

**配置项**：
- `type`：轴类型（`category`/`value`/`time`/`log`）
- `min`/`max`：范围
- `tickCount`：刻度数量
- `labelFormatter`：标签格式化（`${value}` 插值）
- `labelRotate`：标签旋转角度
- `splitLine`：是否显示网格线

---

### 交互声明（`@interaction`）

```cdl
@interaction "tooltip:shared legend:true zoom:inside brush:true"
# 或联动
@interaction "tooltip:shared brush:{connect:['chart2']}"
```

**键值对**：
- `tooltip`：`single` / `shared` / `none`
- `legend`：`true` / `false`
- `zoom`：`true` / `inside` / `slider`
- `brush`：`true` 或 `{connect:[]}`

---

## AST 类型定义（TypeScript）

```typescript
type ChartType = 
    | 'line' | 'bar' | 'pie' | 'scatter' | 'area'
    | 'radar' | 'heatmap' | 'combo' | 'gauge'
    | 'candlestick' | 'boxplot' | 'sankey' 
    | 'treemap' | 'wordcloud' | 'liquid' | 'map';

interface CDLFile {
    version?: string;
    data: DataDefinition[];
    charts: ChartDefinition[];
}

interface DataDefinition {
    type: 'data';
    name: string;
    lang: 'sql' | 'dax' | 'data';
    config: DataSourceConfig;
    query: string;
}

interface DataSourceConfig {
    source?: string;
    timeout?: number;
    cache?: number;
    params?: Record<string, any>;
}

interface ChartDefinition {
    type: 'chart';
    name?: string;
    chartType: ChartType;
    dataSources: string[];
    x?: string;
    y?: string;
    group?: string;
    series?: SeriesConfig[];
    axis?: AxisConfig[];
    interaction?: InteractionConfig;
    where?: string;
    hints: ChartHint;
}

interface SeriesConfig {
    field: string;
    as?: string;
    type?: ChartType;
    color?: string;
    axis?: 'left' | 'right';
    style?: string;
}

interface AxisConfig {
    position: 'x' | 'y' | 'x2' | 'y2' | 'left' | 'right' | 'top' | 'bottom';
    type?: string;
    min?: number | string;
    max?: number | string;
    tickCount?: number;
    labelFormatter?: string;
    labelRotate?: number;
    splitLine?: boolean;
}

interface InteractionConfig {
    tooltip?: 'single' | 'shared' | 'none';
    legend?: boolean;
    zoom?: boolean | 'inside' | 'slider';
    brush?: boolean | { connect: string[] };
}

interface ChartHint {
    style?: string;
    color?: string;
    animation?: string;
    title?: string;
    subtitle?: string;
    layout?: string;
    theme?: 'light' | 'dark' | 'auto';
    grid?: boolean;
}
```

---

## 多图表分隔

使用 `---` 分隔多个图表：

```cdl
# 图表一
...

---

# 图表二
...
```

---

## 设计原则

1. **极简主义**：最少关键字表达意图
2. **自然映射**：标题→图表，表格→数据，关键词→类型
3. **渐进增强**：核心简单，高级特性可选
4. **AI 优先**：结构化、可预测、易生成
5. **ECharts 友好**：极简表达，完整映射
6. **舍弃低频**：不追求 100% 配置覆盖，保留 80% 高频场景

---

*文档版本：v0.6（规划中）*  
*更新日期：2026-03-14*