# 语法规范

## 分层架构

CDL 采用分层架构设计：

```
核心层（必须结构化）    提示层（自然语言）
    ↓                      ↓
Data/Chart 定义          @style @color @hint
语法解析                  端侧 AI 解析
```

## 数据源定义

### 基本结构

```cdl
@lang(sql|dax|data)
[@source('连接名')]
[@timeout(30)]
[@cache(3600)]
DataName {
    查询内容
}
```

### 查询类型

**SQL 查询**
```cdl
@lang(sql)
@source('sales_db')
SalesData {
    SELECT month, amount FROM sales
}
```

**DAX 查询**
```cdl
@lang(dax)
@source('powerbi_model')
RevenueData {
    EVALUATE SUMMARIZE(Sales, Sales[Month], "Revenue", SUM(Sales[Amount]))
}
```

**裸数据**
```cdl
@lang(data)
StaticData {
    month,amount
    1月,100
    2月,200
}
```

## 图表定义

### 基本结构

```cdl
Chart [名称] {
    // 数据源引用
    use DataName [as alias]
    
    // 核心属性
    type line|bar|pie|scatter|area|radar|combo|heatmap
    x column_name
    y column_name
    [group column_name]
    [stack column_name|true]
    
    // @提示层
    @style "..."
    @color "..."
    @animation "..."
    @title "..."
}
```

### 核心属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `type` | 图表类型 | `type line` |
| `x` | X 轴字段 | `x month` |
| `y` | Y 轴字段 | `y sales` |
| `group` | 分组字段（多序列） | `group category` |
| `stack` | 堆叠字段 | `stack true` |
| `use` | 引用数据源 | `use SalesData` |

### @提示层

| 提示 | 说明 | 示例 |
|------|------|------|
| `@style` | 视觉样式 | `@style "平滑曲线"` |
| `@color` | 配色方案 | `@color "#4fc3f7"` |
| `@animation` | 动画效果 | `@animation "从左到右"` |
| `@title` | 图表标题 | `@title "销售趋势"` |
| `@interaction` | 交互行为 | `@interaction "hover 显示数值"` |

## 渐进式渲染

| 渲染端能力 | 核心层 | @提示层 |
|-----------|-------|---------|
| 基础渲染器 | 必须支持 | 忽略 |
| 标准渲染器 | 必须支持 | 解析简单提示 |
| AI 增强渲染器 | 必须支持 | 端侧模型解析 |
| 人读模式 | 显示 | 显示为设计意图 |
