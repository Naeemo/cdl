# CDL 语法规范 v0.1

## 设计理念
- **分层架构**：核心层（结构化）+ 提示层（自然语言 @提示）
- **渐进渲染**：基础端解析核心，高级端解析 @提示
- **AI 友好**：简洁、可组合、上下文友好

---

## 核心语法

### 1. 数据源定义

```cdl
// SQL 数据源
@lang(sql)
@source('sales_db')
SalesData {
    SELECT month, amount FROM sales_2024 ORDER BY month
}

// DAX 数据源
@lang(dax)
@source('powerbi_model')
RevenueData {
    SUMMARIZE(
        Sales,
        Sales[Month],
        "Revenue", SUM(Sales[Amount])
    )
}

// 裸数据源
@lang(data)
StaticData {
    month,amount
    1月,100
    2月,150
    3月,200
}
```

### 2. 图表定义

```cdl
Chart {
    // 数据源（可多个）
    use SalesData
    use RevenueData
    
    // 图表类型（核心属性）
    type line
    
    // 坐标轴映射（核心属性）
    x month
    y amount
    
    // @提示层（视觉/交互细节）
    @style "平滑曲线，带数据点标记"
    @color "主色 #4fc3f7，辅色 #29b6f6"
    @animation "从左到右绘制"
}
```

---

## 语法规则

### 数据源（Data）

```
@lang(sql|dax|data)
[@source('连接名')]
[@timeout(30)]
[@cache(3600)]
DataName {
    查询内容
}
```

**@lang 类型：**
- `sql` - SQL 查询
- `dax` - DAX 表达式
- `data` - 裸数据（CSV 格式）

**可选 @配置：**
- `@source('name')` - 数据源连接
- `@timeout(seconds)` - 查询超时
- `@cache(seconds)` - 缓存时间
- `@params({...})` - 查询参数

### 图表（Chart）

```
Chart [Name] {
    // 数据源引用
    use DataName [as alias]
    
    // 核心属性（决定图表本质）
    type line|bar|pie|scatter|area|combo|radar|heatmap
    x column_name
    y column_name
    [group column_name]
    [stack column_name]
    
    // 过滤（可选）
    where condition
    
    // @提示层
    @style "..."
    @color "..."
    @animation "..."
    @interaction "..."
}
```

**核心属性：**
- `type` - 图表类型（必须）
- `x` / `y` - 坐标轴映射（必须）
- `group` - 分组字段
- `stack` - 堆叠字段
- `where` - 数据过滤

**@提示层：**
- `@style` - 视觉样式描述
- `@color` - 配色方案
- `@animation` - 动画效果
- `@interaction` - 交互行为
- `@title` - 标题/说明

---

## 图表类型速查

| 类型 | 核心属性 | 典型 @提示 |
|------|---------|-----------|
| line | x, y, [group] | 平滑、阶梯、面积填充 |
| bar | x, y, [stack] | 横向/纵向、堆叠、圆角 |
| pie | label, value | 环形、玫瑰图、图例位置 |
| scatter | x, y, [size] | 气泡、趋势线、聚类 |
| area | x, y, [group] | 堆叠、渐变填充 |
| combo | 多序列定义 | 混合类型（线+柱）|
| radar | dim, value | 多边形、圆形 |
| heatmap | x, y, value | 色阶、区块大小 |

---

## 示例片段规范

每个示例应包含：
1. 数据源定义（SQL/DAX/Data）
2. 图表定义（核心属性）
3. @提示层（展示灵活性）
4. 注释说明用途

**文件名规范：**
```
{查询类型}/{图表类型}/{序号}_{描述}.cdl

示例：
sql/line/01_monthly_sales.cdl
dax/bar/02_regional_revenue.cdl
data/pie/03_category_distribution.cdl
```

---

## 渐进式渲染策略

| 渲染端能力 | 核心层 | @提示层 |
|-----------|-------|---------|
| 基础渲染器 | 必须支持 | 忽略 |
| 标准渲染器 | 必须支持 | 解析简单提示 |
| AI 增强渲染器 | 必须支持 | 端侧模型解析为配置 |
| 人读模式 | 显示 | 显示为设计意图 |

---

## 版本历史

- v0.1 (2026-03-11) - 初始规范
