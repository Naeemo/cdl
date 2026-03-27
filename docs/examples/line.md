# 折线图示例

## 基础折线图

```cdl
# 月度销售额趋势

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |
| 4月 | 180 |
| 5月 | 220 |

## line

@color #4fc3f7
@style smooth
@title 2024年销售趋势
```

---

## 多系列折线图

```cdl
# 各区域销售对比

| 月份 | 华北 | 华南 | 华东 |
| --- | --- | --- | --- |
| 1月 | 100 | 120 | 150 |
| 2月 | 150 | 180 | 200 |
| 3月 | 200 | 220 | 250 |

## line

@interaction "tooltip:shared"
```

---

## 自定义样式

```cdl
# 销售趋势（自定义样式）

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |
| 4月 | 180 |
| 5月 | 220 |

## line

@color #ff6b6b
@style dashed
@theme dark
@grid true
@animation elastic
```

---

## 完整配置示例

```cdl
# 季度销售分析

| 季度 | 销售额 | 利润 |
| --- | --- | --- |
| Q1 | 450 | 45 |
| Q2 | 600 | 72 |
| Q3 | 580 | 68 |
| Q4 | 720 | 95 |

## combo

## series
| field | as | type | color | axis |
| --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | line | #4fc3f7 | left |
| 利润 | 利润(万元) | bar | #ff9800 | right |

## axis y left
min: 0
max: 800
labelFormatter: "${value}万"

## axis y right
min: 0
max: 100
labelFormatter: "${value}万"

@title 季度销售与利润分析
@interaction "tooltip:shared zoom:inside"
```

---

*文档版本：v0.7*