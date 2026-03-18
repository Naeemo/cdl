# 坐标轴配置

axis 块允许精细控制图表坐标轴的各项属性。

## 基础用法

```cdl
Chart {
    use Data
    type line
    x month
    y amount
    
    ## axis x
    type: category
    name: 月份
    labelRotate: 45
    
    ## axis y
    type: value
    name: 销售额(万元)
    min: 0
    max: 200
}
```

## 坐标轴标识

| 标识 | 说明 | 典型用途 |
|------|------|----------|
| `x` 或 `x1` | 主 X 轴（底部） | 分类、时间 |
| `y` 或 `y1` | 主 Y 轴（左侧） | 数值 |
| `x2` | 副 X 轴（顶部） | 辅助分类 |
| `y2` | 副 Y 轴（右侧） | 第二数值（双轴图表） |

## 通用配置项

### type
- `category` - 类目轴（字符串）
- `value` - 数值轴（数字）
- `time` - 时间轴
- `log` - 对数轴

### name
坐标轴名称，显示在轴末端。

### nameLocation
- `start` - 起点
- `center` - 中间
- `end` - 末端（默认）

### min / max
轴的范围。可以留空自动计算。

### scale
`true` 表示从 0 开始计算（默认），`false` 仅使用数据最小最大值。

### splitNumber
分割段数，默认 5。

### interval
强制指定分割间隔。

### axisLabel
标签样式配置：

```cdl
## axis y
axisLabel:
  formatter: ${value}万元  // 模板
  color: #333
  fontSize: 12
  rotate: 0
```

### axisLine
轴线样式：

```cdl
axisLine:
  show: true
  lineStyle:
    color: #999
    width: 1
    type: solid
```

### axisTick
刻度线：

```cdl
axisTick:
  show: true
  length: 5
  lineStyle:
    color: #999
```

## 坐标轴配置示例

### 时间轴

```cdl
## axis x
type: time
name: 日期
min: 2024-01-01
max: 2024-12-31
```

### 数值轴（百分比）

```cdl
## axis y
type: value
name: 完成率
min: 0
max: 100
axisLabel:
  formatter: ${value}%
```

### 对数轴

```cdl
## axis y
type: log
base: 10
name: 数值（对数）
```

### 隐藏轴线

```cdl
## axis x
axisLine: { show: false }
axisTick: { show: false }
```

### 网格线控制

```cdl
splitLine:
  show: true
  lineStyle:
    color: #eee
    type: dashed
```

## 多轴完整示例

```cdl
@lang(data)
MixedData {
    month,sales,profit,rate
    1月,100,15,12.5
    2月,120,18,15.0
    3月,140,22,15.7
}

Chart {
    use MixedData
    type combo
    
    ## series
    | field | as | type | axis |
    | --- | --- | --- | --- |
    | sales | 销售额 | bar | left |
    | profit | 利润 | line | left |
    | rate | 增长率 | line | right |
    
    ## axis x
    type: category
    
    ## axis y
    name: 金额(万元)
    min: 0
    
    ## axis y2
    name: 百分比(%)
    min: 0
    max: 100
    axisLabel:
      formatter: ${value}%
}
```

## 与主题配合

坐标轴颜色会自动适配主题。如需覆盖：

```cdl
## axis y
axisLabel:
  color: theme.text  // 自动跟随主题文字色
```

## 常见问题

**Q: 如何让 Y 轴从 0 开始？**  
A: 设置 `min: 0`，或让 `scale: true`（默认）。

**Q: X 轴标签重叠怎么办？**  
A: 使用 `labelRotate: 45` 旋转，或 `interval: 1` 隔点显示。

**Q: 如何隐藏坐标轴？**  
A: `axisLine: { show: false }` 和 `axisLabel: { show: false }`。

## 参考

- [ECharts 坐标轴文档](https://echarts.apache.org/zh/option.html#xAxis)
- [图表类型参考](./charts-reference.md)
- [系列配置](./series-config.md)