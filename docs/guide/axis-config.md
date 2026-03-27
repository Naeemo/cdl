# 坐标轴配置

axis 块允许精细控制图表坐标轴的各项属性。

---

## 基础用法

```cdl
# 月度销售

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line

## axis x
name: 月份
labelRotate: 45

## axis y
name: 销售额(万元)
min: 0
max: 250
```

---

## 坐标轴标识

| 标识 | 说明 | 典型用途 |
|------|------|----------|
| `x` 或 `x1` | 主 X 轴（底部） | 分类、时间 |
| `y` 或 `y1` | 主 Y 轴（左侧） | 数值 |
| `x2` | 副 X 轴（顶部） | 辅助分类 |
| `y2` | 副 Y 轴（右侧） | 第二数值（双轴图表） |

---

## 通用配置项

### type
- `category` - 类目轴（字符串）
- `value` - 数值轴（数字）
- `time` - 时间轴
- `log` - 对数轴

### 范围控制
- `min` - 最小值
- `max` - 最大值

### 标签配置
- `name` - 轴名称
- `labelRotate` - 标签旋转角度（0-90）
- `labelFormatter` - 标签格式化（如 `"${value}万"`）

### 刻度与网格
- `tickCount` - 刻度数量
- `splitLine` - 是否显示网格线（true/false）

---

## 双 Y 轴示例

```cdl
# 销售额与利润率

| 月份 | 销售额 | 利润率 |
| --- | --- | --- |
| 1月 | 120 | 12% |
| 2月 | 150 | 13% |
| 3月 | 180 | 14% |

## combo

## series
| field | as | type | axis |
| --- | --- | --- | --- |
| 销售额 | 销售额 | bar | left |
| 利润率 | 利润率 | line | right |

## axis y left
min: 0
max: 200
labelFormatter: "${value}万"
splitLine: true

## axis y right
min: 0
max: 20
labelFormatter: "${value}%"
```

---

## X 轴标签旋转

当类别较多时，旋转标签避免重叠：

```cdl
# 月度数据（12个月）

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 120 |
| ... | ... |
| 12月 | 200 |

## line

## axis x
labelRotate: 45
```

---

## 时间轴配置

```cdl
# 销售趋势

| 日期 | 销售额 |
| --- | --- |
| 2024-01-01 | 100 |
| 2024-02-01 | 150 |
| 2024-03-01 | 200 |

## line

## axis x
type: time
labelFormatter: "MM-dd"
```

---

## 对数坐标轴

适用于数值跨度大的数据：

```cdl
## axis y
type: log
base: 10
```

---

*文档版本：v0.7*