# 图表类型

CDL 支持多种常见图表类型，通过 `type` 属性指定。

## 支持的图表类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `line` | 折线图 | 趋势变化、时间序列 |
| `bar` | 柱状图 | 类别对比、排名 |
| `pie` | 饼图 | 占比分析、构成 |
| `scatter` | 散点图 | 相关性分析、分布 |
| `area` | 面积图 | 累积趋势、占比变化 |
| `radar` | 雷达图 | 多维度评估 |
| `combo` | 组合图 | 多类型混合展示 |
| `heatmap` | 热力图 | 矩阵数据、密度分布 |

## 折线图 (line)

```cdl
Chart 趋势 {
    use SalesData
    type line
    x month
    y sales
    
    @style "平滑曲线"
    @color "#4fc3f7"
}
```

### 多线对比

```cdl
Chart 对比 {
    use MultiSeriesData
    type line
    x month
    y sales
    group region    // 按 region 分组，生成多条线
}
```

## 柱状图 (bar)

```cdl
Chart 排名 {
    use CategoryData
    type bar
    x category
    y value
    
    @style "横向排列"
}
```

### 堆叠柱状图

```cdl
Chart 堆叠 {
    use StackedData
    type bar
    x month
    y amount
    group product
    stack true
}
```

## 饼图 (pie)

```cdl
Chart 占比 {
    use CategoryData
    type pie
    x category    // 分类字段
    y value       // 数值字段
    
    @style "环形图"
    @color "渐变蓝"
}
```

## 散点图 (scatter)

```cdl
Chart 分布 {
    use CorrelationData
    type scatter
    x price
    y sales
    group region    // 不同颜色表示不同区域
}
```

## 面积图 (area)

```cdl
Chart 累积 {
    use TrendData
    type area
    x month
    y sales
    stack true      // 堆叠面积图
}
```

## 雷达图 (radar)

```cdl
Chart 评估 {
    use RadarData
    type radar
    x dimension     // 维度：如质量、价格、服务...
    y score         // 分数
    group product   // 多个产品对比
}
```

## 组合图 (combo)

```cdl
Chart 混合 {
    use ComboData
    type combo
    x month
    y sales         // 默认柱状图
    y line target   // 折线显示目标
}
```

## 热力图 (heatmap)

```cdl
Chart 密度 {
    use MatrixData
    type heatmap
    x hour          // X轴：小时
    y day           // Y轴：星期
    y value         // 颜色深浅表示数值
    
    @color "热力配色"
}
```

## 图表属性速查

| 属性 | 所有类型 | 说明 |
|------|----------|------|
| `type` | ✓ | 图表类型 |
| `x` | ✓ | X轴字段 |
| `y` | ✓ | Y轴字段 |
| `group` | line, bar, scatter, radar | 分组字段，生成多序列 |
| `stack` | bar, area | 堆叠，true 或字段名 |

## 样式提示

使用 `@` 提示层为图表添加视觉样式：

```cdl
Chart 示例 {
    use Data
    type line
    x month
    y sales
    
    @style "平滑曲线，带数据点标记"
    @color "蓝色系渐变"
    @title "2024年销售趋势"
    @animation "从左到右绘制"
}
```
