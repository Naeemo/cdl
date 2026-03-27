# 高级系列配置

series 表格允许在一个图表中定义多个数据系列，支持混合图表类型和双轴。

---

## 基本用法

```cdl
# 销售与利润分析

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |
| 3月 | 180 | 25 |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #5470c6 | left | solid |
| 利润 | 利润(万元) | line | #ee6666 | right | smooth |
```

---

## 字段说明

| 列名 | 是否必需 | 说明 |
|------|----------|------|
| `field` | ✅ 必需 | 数据字段名（对应表格列名） |
| `as` | 可选 | 系列显示名称 |
| `type` | 可选（combo 必填） | 图表类型（line/bar/area/...） |
| `color` | 可选 | 系列颜色（hex 或颜色名） |
| `axis` | 可选 | 坐标轴位置（left/right） |
| `style` | 可选 | 线型（solid/dashed/smooth/marker） |

---

## 混合图表示例

### 柱线混合（双轴）

```cdl
# 月度销售与利润

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |
| 3月 | 180 | 25 |

## combo

## series
| field | as | type | axis | color |
| --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | left | #4fc3f7 |
| 利润 | 利润(万元) | line | right | #ff9800 |

## axis y left
min: 0
max: 200
labelFormatter: "${value}万"

## axis y right
min: 0
max: 30
labelFormatter: "${value}万"

@interaction "tooltip:shared"
```

---

## 多系列柱状图

```cdl
# 各区域销售对比

| 月份 | 华北 | 华南 | 华东 |
| --- | --- | --- | --- |
| 1月 | 100 | 120 | 150 |
| 2月 | 120 | 140 | 180 |
| 3月 | 150 | 160 | 200 |

## bar

## series
| field | as | color |
| --- | --- | --- |
| 华北 | 华北地区 | #4fc3f7 |
| 华南 | 华南地区 | #ff9800 |
| 华东 | 华东地区 | #4caf50 |

@interaction "tooltip:shared"
```

---

## 堆叠面积图

```cdl
# 累积用户数

| 日期 | 新增用户 | 回流用户 |
| --- | --- | --- |
| 周一 | 100 | 20 |
| 周二 | 150 | 30 |
| 周三 | 120 | 25 |
| 周四 | 180 | 40 |

## area

## series
| field | as | type | color |
| --- | --- | --- | --- |
| 新增用户 | 新增 | area | #4fc3f7 |
| 回流用户 | 回流 | area | #ff9800 |

@theme dark
```

---

## 样式选项

### 线型样式

| style | 说明 | 适用类型 |
|-------|------|----------|
| `solid` | 实线 | line, area |
| `dashed` | 虚线 | line, area |
| `smooth` | 平滑曲线 | line, area |
| `marker` | 显示数据点标记 | line |

---

*文档版本：v0.7*