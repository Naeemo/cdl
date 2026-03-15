# 交互行为示例（v0.6）

v0.6 引入 `@interaction` 指令，可以声明式配置图表的交互行为，包括提示框、缩放、刷选等。

---

## 提示框（Tooltip）

### 共享提示（axis）

折线图/柱状图中，鼠标悬停时显示同一 X 轴点的所有系列值：

```cdl
@interaction "tooltip:shared"
```

**效果**：
- 鼠标移到 X 轴某点，显示该点所有系列的值
- 对比分析时非常有用

### 单系列提示（item）

饼图/散点图等，只显示当前悬停的数据项：

```cdl
@interaction "tooltip:single"
```

### 禁用提示

```cdl
@interaction "tooltip:none"
```

---

## 数据缩放（DataZoom）

### 鼠标滚轮缩放（inside）

```cdl
@interaction "zoom:inside"
```

**效果**：
- 在图表区域滚动鼠标滚轮，可放大/缩小
- 拖拽可平移

### 底部滑块（slider）

```cdl
@interaction "zoom:slider"
```

**效果**：
- 图表底部出现缩放滑块
- 适合移动端或精确控制

### 同时启用两种

```cdl
@interaction "zoom:inside zoom:slider"
```

---

## 刷选（Brush）

刷选可用于选择数据区域，并联动其他图表。

### 基本刷选

```cdl
@interaction "brush:true"
```

**效果**：
- 图表右上角出现刷选工具（矩形、多边形、清除）
- 可在图表中框选数据点

### 多图表联动

假设有两个图表，刷选一个图表时，另一个图表同步显示选中数据：

```cdl
# 图表一
@interaction "brush:{connect:['chart2']}"

# 图表二（在另一个 CDL 文件或同文件多图表）
@interaction "brush:{connect:['chart1']}"
```

**说明**：
- `connect` 数组列出需要联动的图表名称（`Chart` 块的 `name` 字段）
- 两个图表都需要配置 `brush` 才能联动

---

## 组合交互

多个交互选项可以组合：

```cdl
@interaction "tooltip:shared zoom:inside brush:true"
```

**完整示例**（组合图）：

```cdl
# 销售分析

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |
| 3月 | 180 | 25 |

## combo

## series
| field | as | type | axis |
| --- | --- | --- | --- |
| 销售额 | 销售额 | bar | left |
| 利润 | 利润 | line | right |

@interaction "tooltip:shared zoom:inside brush:{connect:['profit_chart']}"
```

---

## 与 `@grid` 配合

交互通常需要网格线辅助定位：

```cdl
@grid true  # 默认就是 true，可省略

## axis y
splitLine: true
```

---

## 注意事项

1. **性能**：`zoom:inside` 和 `brush` 会增加内存占用，大数据量时慎用
2. **移动端**：`zoom:slider` 更适合移动端触摸操作
3. **联动要求**：多图表联动时，图表 `name` 必须唯一且明确指定
4. **默认值**：
   - `tooltip` 默认 `axis`（折线图/柱状图）或 `item`（饼图/散点图）
   - `zoom` 默认关闭
   - `brush` 默认关闭

---

## 完整示例（交互式仪表板）

```cdl
# 实时监控面板

| 时间 | CPU | 内存 | 网络 |
| --- | --- | --- | --- |
| 00:00 | 45 | 60 | 120 |
| 02:00 | 30 | 55 | 80 |
| 04:00 | 25 | 50 | 60 |
| 06:00 | 40 | 58 | 90 |
| 08:00 | 65 | 70 | 150 |
| 10:00 | 80 | 75 | 200 |

## area

## series
| field | as | type | color |
| --- | --- | --- | --- |
| CPU | CPU使用率(%) | area | #ff9800 |
| 内存 | 内存使用率(%) | area | #4fc3f7 |
| 网络 | 网络流量(MB) | line | #e91e63 |

## axis y
min: 0
max: 100
labelFormatter: "${value}%"

@title "系统监控"
@interaction "tooltip:shared zoom:slider"
@theme "dark"
```

**效果**：
- 面积图展示趋势
- 右轴（自动）用于网络流量（数值不同）
- 暗色主题
- 底部滑块缩放

---

## 与 ECharts 原生配置对比

| CDL 语法 | ECharts option |
|----------|----------------|
| `@interaction "tooltip:shared"` | `tooltip: { trigger: 'axis' }` |
| `@interaction "zoom:inside"` | `dataZoom: [{ type: 'inside' }]` |
| `@interaction "zoom:slider"` | `dataZoom: [{ type: 'slider', bottom: 10 }]` |
| `@interaction "brush:true"` | `brush: { toolbox: ['rect', 'polygon', 'clear'] }` |
| `@interaction "brush:{connect:['c2']}"` | `brush: { link: { x: 'c2' } }` |

v0.6 的目标是让这些常用配置变得简单易用！

---

**更多交互选项待探索**：
- 图例筛选（legend selection）
- 数据区域缩放（dataZoom 区域）
- 动态数据更新（pending）