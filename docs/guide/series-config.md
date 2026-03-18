# 高级系列配置

series 表格允许在一个图表中定义多个数据系列，支持混合图表类型和双轴。

## 基本用法

```cdl
Chart 混合图表 {
    use Data
    type combo
    
    ## series
    | field | as | type | color | axis |
    | --- | --- | --- | --- | --- |
    | sales | 销售额 | bar | #5470c6 | left |
    | profit | 利润 | line | #ee6666 | right |
}
```

## 字段说明

| 列名 | 是否必需 | 说明 |
|------|----------|------|
| `field` | ✅ 必需 | 数据字段名 |
| `as` | 可选 | 系列显示名称 |
| `type` | 可选（combo 必填） | 图表类型（line/bar/...） |
| `color` | 可选 | 系列颜色（hex 或颜色名） |
| `axis` | 可选 | 坐标轴位置（left/right） |
| `style` | 可选 | 线型（solid/dashed/smooth/marker） |

## 混合图表示例

### 柱线混合（双轴）

```cdl
@lang(data)
Monthly {
    month,sales,profit
    1月,120,15
    2月,150,20
    3月,180,25
}

Chart {
    use Monthly
    type combo
    
    ## series
    | field | as | type | axis |
    | --- | --- | --- | --- |
    | sales | 销售额(万元) | bar | left |
    | profit | 利润(万元) | line | right |
    
    ## axis y2  // 配置右侧 Y 轴
    name: 利润
    min: 0
    max: 50
}
```

### 多系列折线图

```cdl
## series
| field | as | style |
| --- | --- | --- |
| product_a | 产品A | smooth |
| product_b | 产品B | smooth |
| product_c | 产品C | dashed |
```

## 坐标轴配置

配合 series 使用 axis 块定义多轴：

```cdl
## axis x
type: category

## axis y
name: 销售额
min: 0

## axis y2
name: 利润率
min: 0
max: 100
position: right
```

## 样式自定义

### 颜色映射

```cdl
@color "sales=#5470c6,profit=#ee6666"
```

或 series 表格中逐条设置。

### 线型样式

```cdl
## series
| field | style |
| --- | --- |
| actual | smooth |
| forecast | dashed |
| target | marker |
```

支持：
- `solid` - 实线
- `dashed` - 虚线
- `dotted` - 点线
- `smooth` - 平滑曲线
- `marker` - 带数据点标记

## 注意事项

- `type combo` 必须使用 series 表格
- 多轴时，每个 series 通过 `axis` 指定对应轴（left/y/right/y2）
- 颜色优先顺序：series.color > @color > 主题色
- axis 块中的配置优先级高于全局

## 完整示例

```cdl
@lang(data)
Performance {
    quarter,revenue,profit,growth
    Q1,100,15,12
    Q2,120,18,15
    Q3,140,22,18
    Q4,160,28,20
}

Chart 季度业绩 {
    use Performance
    type combo
    
    ## series
    | field | as | type | color | axis | style |
    | --- | --- | --- | --- | --- | --- |
    | revenue | 营收 | bar | #5470c6 | left | solid |
    | profit | 利润 | line | #ee6666 | right | smooth |
    | growth | 增长率 | line | #91cc75 | right | dashed |
    
    ## axis y2
    name: 百分比 (%)
    min: 0
    max: 30
    position: right
    
    @title "季度业绩分析"
    @responsive true
}
```