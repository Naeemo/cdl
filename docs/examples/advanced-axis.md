# 多轴与坐标轴配置示例（v0.6）

v0.6 引入 `## axis <position>` 语法，可以精细控制坐标轴的显示范围、刻度、标签格式等。

---

## 单个坐标轴配置

### X 轴标签旋转

当 X 轴类别较多时，旋转标签避免重叠：

```cdl
# 月度销售数据（12个月）

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 120 |
| ... | ... |
| 12月 | 200 |

## line

## axis x
labelRotate: 45  # 旋转45度
```

### Y 轴范围与格式化

```cdl
## axis y
min: 0
max: 1000
tickCount: 5
labelFormatter: "${value}万元"
splitLine: true
```

**配置说明**：
- `min` / `max`：坐标轴范围（默认自动计算）
- `tickCount`：刻度数量（默认 5 个）
- `labelFormatter`：标签格式化，`${value}` 会被替换为实际值
- `splitLine`：是否显示网格线（Y 轴默认 `true`，X 轴默认 `false`）

---

## 双 Y 轴配置（组合图）

组合图通常需要左右两个 Y 轴：

```cdl
# 销售额与利润率

| 月份 | 销售额 | 利润率 |
| --- | --- | --- |
| 1月 | 120 | 12% |
| 2月 | 150 | 13% |

## combo

## series
| field | as | type | axis |
| --- | --- | --- | --- |
| 销售额 | 销售额 | bar | left |
| 利润率 | 利润率 | line | right |

## axis y        # 左轴
min: 0
max: 200
labelFormatter: "${value}万"

## axis y2       # 右轴
min: 0
max: 20
labelFormatter: "${value}%"
```

**位置标识**：
- `## axis y` 或 `## axis left` → 左轴
- `## axis y2` 或 `## axis right` → 右轴
- `## axis x` → 底部 X 轴
- `## axis x2` 或 `## axis top` → 顶部 X 轴

---

## 时间轴配置

如果 X 轴是时间数据，可以设置为时间类型：

```cdl
## axis x
type: time
min: "2024-01-01"
max: "2024-12-31"
```

**时间格式**：ISO 8601 或任何 ECharts 支持的时间字符串。

---

## 对数坐标轴

适用于数值跨度大的数据：

```cdl
## axis y
type: log
base: 10  # 可选，默认为 10
```

---

## 完整示例（科学图表）

```cdl
# 实验数据对比

| 时间点 | 浓度A | 浓度B | 温度 |
| --- | --- | --- | --- |
| 0h | 100 | 80 | 25 |
| 6h | 250 | 120 | 28 |
| 12h | 500 | 200 | 32 |
| 24h | 800 | 350 | 35 |

## combo

## series
| field | as | type | color | axis |
| --- | --- | --- | --- | --- |
| 浓度A | 浓度A (mg/L) | line | #4fc3f7 | left |
| 浓度B | 浓度B (mg/L) | line | #ff9800 | left |
| 温度 | 温度(°C) | line | #e91e63 | right |

## axis y
min: 0
max: 1000
labelFormatter: "${value} mg/L"

## axis y2
min: 0
max: 50
labelFormatter: "${value} °C"
name: "温度"

@title "实验数据随时间变化"
```

---

## 与 `@grid` 指令配合

`@grid false` 可以隐藏所有网格线：

```cdl
@grid false

## axis y
min: 0
max: 100
```

---

## 注意事项

1. **轴位置不要重复**：每个位置（x/y/y2）只能定义一次，后定义的会合并/覆盖
2. **类型匹配**：`type: category` 用于类目轴，`type: value` 用于数值轴，`type: time` 用于时间轴
3. **格式化字符串**：`labelFormatter` 支持 `${value}` 占位符，也可以使用 ECharts 原生格式化函数（但建议用简单字符串）
4. **堆叠与分组**：`## axis` 只控制坐标轴，不控制系列排列。堆叠用 `stack: true`，分组用 `group` 字段

---

## 参考

- [ECharts 坐标轴配置](https://echarts.apache.org/zh/option.html#xAxis)
- [labelFormatter 格式化](https://echarts.apache.org/zh/option.html#xAxis.axisLabel.formatter)