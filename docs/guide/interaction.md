# 交互配置指南

CDL 支持丰富的交互功能，包括 tooltip、zoom、brush 等。

---

## 配置方式

### @interaction 指令

```cdl
# 月度销售

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line

@interaction "tooltip:shared zoom:inside"
```

---

## 交互选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `tooltip` | `single` \| `shared` \| `none` | 提示框触发方式 |
| `zoom` | `inside` \| `slider` \| `false` | 缩放方式 |
| `brush` | `true` \| `false` | 刷选功能 |

---

## 提示框（Tooltip）

### 共享提示（推荐用于多系列）

```cdl
@interaction "tooltip:shared"
```

鼠标悬停时显示同一 X 轴点的所有系列值。

### 单系列提示

```cdl
@interaction "tooltip:single"
```

仅显示当前悬停的数据项。

### 禁用提示

```cdl
@interaction "tooltip:none"
```

---

## 数据缩放（Zoom）

### 鼠标滚轮缩放

```cdl
@interaction "zoom:inside"
```

在图表区域滚动鼠标滚轮可放大/缩小。

### 底部滑块

```cdl
@interaction "zoom:slider"
```

图表底部出现缩放滑块。

### 同时启用

```cdl
@interaction "zoom:inside zoom:slider"
```

---

## 刷选（Brush）

```cdl
@interaction "brush:true"
```

图表右上角出现刷选工具（矩形、多边形、清除）。

---

## 组合配置

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

@interaction "tooltip:shared zoom:inside brush:true"
```

---

*文档版本：v0.7*