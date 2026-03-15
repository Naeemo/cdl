# 折线图示例

## 快速语法（推荐新手）

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

@color "#4fc3f7"
@style "smooth"
```

---

## 标准语法（推荐生产）

```cdl
@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
    4月,180
    5月,220
}

Chart 月度销售趋势 {
    use SalesData
    type line
    x month
    y sales
    
    @color "#4fc3f7"
    @style "smooth"
    @title "2024年月度销售趋势"
}
```

---

## 高级语法（多系列 + 双轴）

```cdl
@lang(data)
MultiData {
    month,sales,profit
    1月,100,15
    2月,150,20
    3月,200,25
    4月,180,22
    5月,220,28
}

# 销售额与利润对比

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 100 | 15 |
| 2月 | 150 | 20 |
| 3月 | 200 | 25 |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| sales | 销售额(万元) | line | #4fc3f7 | left | smooth |
| profit | 利润(万元) | line | #ff9800 | right | smooth |

## axis y left
min: 0
max: 250
labelFormatter: "${value}万"

## axis y right
min: 0
max: 50
labelFormatter: "${value}万"

@interaction "tooltip:shared"
```

---

## 关键配置说明

| 配置 | 说明 | 示例 |
|------|------|------|
| `## line` | 图表类型 | 折线图 |
| `@style "smooth"` | 曲线样式 | 平滑曲线（默认折线） |
| `@style "step"` | 阶梯线 | 阶梯样式 |
| `@style "step-after"` | 后阶梯 | 延迟阶梯 |
| `@color` | 主色调 | `#4fc3f7` |
| `group` | 多线分组 | `group series` |
| `## series` | 系列配置 | 每线独立颜色/坐标轴 |
| `## axis y2` | 右轴配置 | 双Y轴对比 |

---

## 常见场景

### 1. 多线对比（分组数据）

```cdl
@lang(data)
CompareData {
    month,productA,productB,productC
    1月,100,80,60
    2月,150,120,90
    3月,200,160,120
}

Chart 多产品对比 {
    use CompareData
    type line
    x month
    group product  # 自动识别三列为三个系列
}
```

### 2. 阈值标记

```cdl
@lang(data)
TargetData {
    month,sales,target
    1月,100,120
    2月,150,140
    3月,200,180
}

# 销售与目标

## line

## series
| field | as | type | style |
| --- | --- | --- | --- |
| sales | 实际销售额 | line | smooth |
| target | 目标 | line | dashed |

@color "#4fc3f7"  # 实际线颜色
```

### 3. 面积填充

```cdl
# 累积用户数

| 月份 | 用户数 |
| --- | --- |
| 1月 | 1000 |
| 2月 | 2500 |
| 3月 | 4500 |

## area

@color "#4fc3f7"
@style "stack"  # 堆叠面积（多系列时）
```

---

*更新日期：2026-03-14*