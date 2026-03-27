# 柱状图示例

## 基础柱状图

```cdl
# 产品销量排名

| 产品 | 销量 |
| --- | --- |
| A | 200 |
| B | 150 |
| C | 120 |
| D | 90 |

## bar

@color #4fc3f7
@title 产品销量排名
```

---

## 分组柱状图

```cdl
# 区域销售对比

| 区域 | 华北 | 华南 | 华东 |
| --- | --- | --- | --- |
| Q1 | 120 | 200 | 180 |
| Q2 | 150 | 220 | 200 |
| Q3 | 180 | 250 | 230 |

## bar

@interaction "tooltip:shared"
```

---

## 堆叠柱状图

```cdl
# 月度销售构成

| 月份 | 线上 | 线下 |
| --- | --- | --- |
| 1月 | 60 | 40 |
| 2月 | 80 | 50 |
| 3月 | 100 | 60 |

## bar

@color #4fc3f7
@interaction "tooltip:shared"
```

---

## 完整配置示例

```cdl
# 年度销售数据

| 季度 | 销售额 | 目标 |
| --- | --- | --- |
| Q1 | 450 | 400 |
| Q2 | 600 | 550 |
| Q3 | 580 | 600 |
| Q4 | 720 | 700 |

## combo

## series
| field | as | type | color |
| --- | --- | --- | --- |
| 销售额 | 实际销售额 | bar | #4fc3f7 |
| 目标 | 销售目标 | line | #ff9800 |

## axis y
min: 0
max: 800
labelFormatter: "${value}万"

@title 年度销售与目标对比
@interaction "tooltip:shared"
```

---

*文档版本：v0.7*