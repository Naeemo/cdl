# 快速开始

## 什么是 CDL

CDL（Chart Definition Language）是一种用于定义数据图表的领域特定语言（DSL）。它的设计目标是：

- **简洁**：用最少的语法表达图表意图
- **安全**：不携带实际数据，只描述"怎么查、怎么画"
- **AI 友好**：结构化、可验证，易于 LLM 生成和修改

## 基础语法

### 1. 定义数据源

```cdl
@lang(sql)
@source('sales_db')
SalesData {
    SELECT month, amount FROM sales_2024
}
```

### 2. 定义图表

```cdl
Chart 月度销售 {
    use SalesData
    type line
    x month
    y amount
}
```

### 3. 添加样式提示

```cdl
Chart 月度销售 {
    use SalesData
    type line
    x month
    y amount
    
    @style "平滑曲线，带数据点"
    @color "#4fc3f7"
    @title "2024年月度销售趋势"
}
```

## 支持的图表类型

- **line** - 折线图
- **bar** - 柱状图
- **pie** - 饼图
- **scatter** - 散点图
- **area** - 面积图
- **radar** - 雷达图
- **combo** - 组合图
- **heatmap** - 热力图

## 下一步

- 查看 [语法规范](./syntax)
- 在线体验 [Playground](../playground/)
- 浏览更多 [示例](../examples/)
