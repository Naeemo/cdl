# CDL 语法规范 v0.6

## 1. 概述

### 1.1 什么是 CDL

CDL（Chart Definition Language，图表定义语言）是一种用于定义数据图表的领域特定语言（DSL）。其设计目标是：

- **简洁声明式**：像写 Markdown 一样简单，2 分钟画出第一个图表
- **AI 友好**：结构化、可验证，便于 LLM 生成和修改
- **安全交付**：DSL 不携带数据，权限和数据留在服务端
- **渐进渲染**：核心层必渲染，提示层可选解析

### 1.2 核心理念

- **关注"要什么"，而非"怎么做"**：声明意图，而非具体实现
- **数据与表现分离**：数据查询独立于图表定义
- **极简表达**：舍弃不高频的细节配置，保留核心能力
- **ECharts 选项的极简映射**：在简洁性和表达力之间找到平衡

---

## 2. 语法结构

CDL 文件由两部分组成：

```
[数据源定义]*

[图表定义]*
```

- **数据源定义**（可选）：声明数据来源（SQL、DAX 或内联数据）
- **图表定义**（必需）：至少一个图表定义

文件按顺序解析，数据源可被多个图表引用。

---

## 3. 数据源定义

### 3.1 内联数据（data 语言）

最简单的方式，直接在 CDL 中嵌入数据：

```cdl
@lang(data)
Sales {
    month, amount
    1月, 100
    2月, 150
    3月, 200
}
```

**说明**：
- `@lang(data)` 指定语言为静态数据（CSV 格式）
- 数据块名称 `Sales` 供图表引用
- 第一行为列名，后续为数据行

### 3.2 SQL 查询

从数据库查询数据：

```cdl
@lang(sql)
@source('sales_db')      # 必需：数据源连接名
@timeout(30)             # 可选：查询超时（秒）
@cache(300)              # 可选：缓存时间（秒）
SalesData {
    SELECT 
        month, 
        SUM(amount) as total 
    FROM sales 
    WHERE year = 2024
    GROUP BY month
    ORDER BY month
}
```

### 3.3 DAX 查询（Power BI / Analysis Services）

```cdl
@lang(dax)
@source('powerbi_dataset')
RevenueByQuarter {
    EVALUATE
        SUMMARIZE(
            Sales,
            'Date'[Quarter],
            "Revenue", SUM(Sales[Amount])
        )
}
```

---

## 4. 图表定义（v0.6 三种语法）

CDL 提供三种图表定义语法，满足不同场景：

### 4.1 快速语法（Markdown 风格）——推荐新手

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

### 4.2 标准语法（显式声明）——推荐生产

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

### 4.3 高级语法（多系列 + 坐标轴 + 交互）——P0 新增

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

## 5. 语法详解

### 5.1 图表类型（chartType）

| 类型 | 说明 | 示例 |
|------|------|------|
| `line` | 折线图 | 趋势、变化 |
| `bar` | 柱状图 | 对比、排名 |
| `pie` | 饼图 | 占比、构成 |
| `scatter` | 散点图 | 关系、分布 |
| `area` | 面积图 | 累积、填充 |
| `radar` | 雷达图 | 能力评估 |
| `heatmap` | 热力图 | 矩阵、密度 |
| `combo` | 组合图 | 混合图表 |
| `gauge` | 仪表盘 | 进度、KPI |
| `candlestick` | 蜡烛图 | 金融K线 |
| `boxplot` | 箱线图 | 统计分布 |
| `sankey` | 桑基图 | 流向、漏斗 |
| `treemap` | 矩形树图 | 层次结构 |
| `wordcloud` | 词云图 | 关键词频 |
| `liquid` | 水波图 | 填充进度 |
| `map` | 地图 | 地理分布 |

---

### 5.2 系列配置（`## series`）——新增

用于多系列图表（combo、grouped bar 等）精细控制每个系列。

**语法**：

```cdl
## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left | solid |
| 利润 | 利润(万元) | line | #ff9800 | right | smooth |
```

**字段说明**：

| 列名 | 必需 | 说明 |
|------|------|------|
| `field` | ✅ | 数据表中的列名 |
| `as` | ❌ | 系列显示名称（默认用字段名） |
| `type` | ❌ | 系列图表类型（combo 图覆盖全局 type） |
| `color` | ❌ | 系列颜色（HEX） |
| `axis` | ❌ | 坐标轴：`left` / `right`（默认 left） |
| `style` | ❌ | 样式：`solid` / `dashed` / `smooth` / `marker` |

**回退规则**：无 `## series` 时，自动推断：
- 第一列 → x
- 第二列 → y（单系列）
- 第三列 → group（分组字段）

---

### 5.3 坐标轴配置（`## axis <position>`）——新增

**语法**：

```cdl
## axis x
type: category
labelRotate: 45

## axis y left
min: 0
max: 1000
tickCount: 5
labelFormatter: "${value}万"
splitLine: true

## axis y2  # 别名：y right
min: 0
max: 100
```

**位置标识**：
- `x` / `x2`：X 轴（底部/顶部）
- `y` / `y left`：Y 轴（左侧）
- `y2` / `y right`：Y 轴（右侧）

**配置项**：

| 配置 | 类型 | 说明 |
|------|------|------|
| `type` | string | 轴类型：`category` / `value` / `time` / `log` |
| `min` | number\|string | 最小值（数值或时间字符串） |
| `max` | number\|string | 最大值 |
| `tickCount` | number | 刻度数量 |
| `labelFormatter` | string | 标签格式化（`${value}` 插值） |
| `labelRotate` | number | 标签旋转角度（X 轴） |
| `splitLine` | boolean | 是否显示网格线（Y 轴默认 true） |

---

### 5.4 交互声明（`@interaction`）——增强

**语法**：

```cdl
@interaction "tooltip:shared legend:true zoom:inside brush:true"
# 或联动图表
@interaction "tooltip:shared brush:{connect:['chart2','chart3']}"
```

**键值对**：

| 键 | 值 | 说明 |
|----|----|------|
| `tooltip` | `single` / `shared` / `none` | 提示框模式 |
| `legend` | `true` / `false` | 显示图例 |
| `zoom` | `true` / `inside` / `slider` | 缩放模式 |
| `brush` | `true` 或 `{connect:[]}` | 刷选与联动 |

---

### 5.5 提示层指令（`@` 前缀）

| 指令 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `@color` | string | 主色调（HEX） | `@color "#4fc3f7"` |
| `@style` | string | 样式 | `@style "smooth"` |
| `@animation` | string | 动画 | `@animation "ease-out"` |
| `@title` | string | 标题（覆盖默认） | `@title "自定义标题"` |
| `@subtitle` | string | 副标题 | `@subtitle "2024年数据"` |
| `@layout` | string | 布局 | `@layout "compact"` |
| `@theme` | `light` \| `dark` \| `auto` | 主题 | `@theme "dark"` |
| `@grid` | boolean | 显示网格 | `@grid false` |
| `@interaction` | string | 交互（见 5.4） | `@interaction "tooltip:shared"` |

---

## 6. 类型推断关键词

当省略 `## 图表类型` 时，从标题自动推断：

| 关键词 | 图表类型 | 示例 |
|--------|----------|------|
| 趋势、变化、增长、下降 | `line` | "销售趋势" → 折线图 |
| 对比、排名、分布、数量 | `bar` | "产品销量排名" → 柱状图 |
| 占比、构成、百分比 | `pie` | "市场份额占比" → 饼图 |
| 关系、分布、散点 | `scatter` | "身高体重关系" → 散点图 |
| 累积、面积、填充 | `area` | "累积用户数" → 面积图 |
| 能力、评估、多边形 | `radar` | "能力评估" → 雷达图 |
| 热力、矩阵、密度 | `heatmap` | "用户活跃热力图" → 热力图 |
| 组合、混合、双轴 | `combo` | "销售额与利润" → 组合图 |
| 仪表、进度、达标 | `gauge` | "完成率仪表" → 仪表盘 |
| 默认 | `line` | - |

---

## 7. 完整示例

### 示例 1：快速语法（内联数据 + 自动推断）

```cdl
# 2024年月度销售额趋势

| 月份 | 销售额(万元) |
| --- | --- |
| 1月 | 120 |
| 2月 | 150 |
| 3月 | 180 |
| 4月 | 200 |

@color "#4fc3f7"
@style "smooth"
```

---

### 示例 2：标准语法（SQL 数据源）

```cdl
@lang(sql)
@source('analytics_db')
UserGrowth {
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as users
    FROM users
    WHERE created_at >= '2024-01-01'
    GROUP BY month
    ORDER BY month
}

Chart 用户增长趋势 {
    use UserGrowth
    type line
    x month
    y users
    
    @color "#ff9800"
    @title "2024年用户增长（月）"
    @animation "ease-out"
}
```

---

### 示例 3：高级语法（组合图 + 多轴 + 交互）

```cdl
@lang(sql)
@source('sales_db')
SalesAndProfit {
    SELECT 
        month,
        SUM(sales) as sales,
        SUM(profit) as profit
    FROM monthly_summary
    GROUP BY month
}

# 销售额与利润对比

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
labelRotate: 0

## axis y left
min: 0
max: 200
labelFormatter: "${value}万"
splitLine: true

## axis y right
min: 0
max: 50
labelFormatter: "${value}万"

@interaction "tooltip:shared zoom:inside"
@color "#4fc3f7"  # 默认颜色（系列可覆盖）
```

---

## 8. 抽象语法树（AST）

### 8.1 顶层结构

```typescript
interface CDLFile {
    version?: string;          // CDL 版本（可选，默认 v0.6）
    data: DataDefinition[];    // 数据源列表
    charts: ChartDefinition[]; // 图表列表
}
```

### 8.2 数据定义

```typescript
interface DataDefinition {
    type: 'data';
    name: string;             // 数据源名称（唯一标识）
    lang: 'sql' | 'dax' | 'data';
    config: DataSourceConfig; // 数据源配置
    query: string;            // 查询内容或内联数据
}

interface DataSourceConfig {
    source?: string;    // 数据源连接名（服务端配置）
    timeout?: number;   // 超时（秒）
    cache?: number;     // 缓存（秒）
    params?: Record<string, any>; // 查询参数
}
```

### 8.3 图表定义（v0.6 扩展）

```typescript
type ChartType = 
    | 'line' | 'bar' | 'pie' | 'scatter' | 'area'
    | 'radar' | 'heatmap' | 'combo' | 'gauge'
    | 'candlestick' | 'boxplot' | 'sankey' 
    | 'treemap' | 'wordcloud' | 'liquid' | 'map';

interface ChartDefinition {
    type: 'chart';
    name?: string;             // 图表名称
    chartType: ChartType;      // 图表类型
    dataSources: string[];     // 引用的数据源名称
    
    // 字段映射（标准语法）
    x?: string;               // X 轴字段
    y?: string;               // Y 轴字段
    group?: string;           // 分组字段
    
    // 高级配置（v0.6 新增）
    series?: SeriesConfig[];  // 多系列配置
    axis?: AxisConfig[];      // 坐标轴配置
    interaction?: InteractionConfig; // 交互行为
    
    // 过滤
    where?: string;           // 过滤条件
    
    // 样式提示
    hints: ChartHint;
}

interface SeriesConfig {
    field: string;      // 数据列名（必需）
    as?: string;        // 系列名称（默认用 field）
    type?: ChartType;   // 系列类型（combo 图可混合）
    color?: string;     // HEX 颜色
    axis?: 'left' | 'right'; // 坐标轴
    style?: 'solid' | 'dashed' | 'smooth' | 'marker';
}

interface AxisConfig {
    position: 'x' | 'y' | 'x2' | 'y2' | 'left' | 'right' | 'top' | 'bottom';
    type?: 'category' | 'value' | 'time' | 'log';
    min?: number | string;
    max?: number | string;
    tickCount?: number;
    labelFormatter?: string;   // ${value} 插值
    labelRotate?: number;      // 旋转角度
    splitLine?: boolean;       // 网格线（Y 轴）
}

interface InteractionConfig {
    tooltip?: 'single' | 'shared' | 'none';
    legend?: boolean;
    zoom?: boolean | 'inside' | 'slider';
    brush?: boolean | { connect: string[] };
}

interface ChartHint {
    style?: string;
    color?: string;         // 全局默认颜色
    animation?: string;
    title?: string;
    subtitle?: string;
    layout?: string;
    theme?: 'light' | 'dark' | 'auto';
    grid?: boolean;
}
```

### 8.4 错误类型

```typescript
interface CompileError {
    line: number;      // 行号（从 1 开始）
    column: number;    // 列号（从 0 开始）
    message: string;   // 错误信息
    severity: 'error' | 'warning';
}
```

---

## 9. 版本历史

### v0.6 (规划中)

- ✅ **多系列精细控制**：`## series` 子表格，独立配置每个系列
- ✅ **坐标轴配置**：`## axis <position>` 块，控制范围、刻度、格式化
- ✅ **交互声明**：`@interaction` 键值对，支持 tooltip/zoom/brush 联动
- 🔄 **简化标准语法**：保持现有 `Chart { ... }` 块语法
- ⏳ **类型推断增强**：更智能的图表类型和字段映射

### v0.5 (当前稳定版)

- ✅ Markdown 表格语法（`| col | col |`）
- ✅ 标题驱动图表（`# 标题`）
- ✅ 自动类型推断
- ✅ 内联数据支持
- ✅ @指令提示层
- ✅ 多图表分隔（`---`）

---

## 10. 设计原则

1. **极简主义**：用最少的关键字表达意图
2. **自然映射**：标题→图表，表格→数据，关键词→类型
3. **渐进增强**：核心语法简单，高级特性可选
4. **AI 优先**：结构化、可预测、易生成
5. **ECharts 友好**：极简表达，完整映射到 option
6. **舍弃低频**：不追求 100% 配置覆盖，保留 80% 高频场景

---

*文档生成时间：2026-03-14*  
*目标版本：v0.6（P0 特性：series/axis/interaction）*