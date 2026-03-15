# 柱状图示例

## 快速语法（基础柱状图）

```cdl
# 产品销量排名

| 产品 | 销量 |
| --- | --- |
| A | 200 |
| B | 150 |
| C | 120 |
| D | 90 |

## bar

@color "#4fc3f7"
```

---

## 标准语法（带样式）

```cdl
@lang(data)
RegionData {
    region,sales
    华北,120
    华南,200
    华东,180
    华西,150
}

Chart 区域销售对比 {
    use RegionData
    type bar
    x region
    y sales
    
    @color "#4fc3f7"
    @title "各区域销售额对比"
}
```

---

## 高级语法（分组 + 堆叠）

```cdl
@lang(data)
QuarterlyData {
    quarter,productA,productB
    Q1,100,80
    Q2,120,90
    Q3,150,110
    Q4,180,140
}

# 季度产品销量（分组柱状图）

| 季度 | 产品A | 产品B |
| --- | --- | --- |
| Q1 | 100 | 80 |
| Q2 | 120 | 90 |
| Q3 | 150 | 110 |
| Q4 | 180 | 140 |

## bar

## series
| field | as | type | color |
| --- | --- | --- | --- |
| productA | 产品A | bar | #4fc3f7 |
| productB | 产品B | bar | #ff9800 |

@interaction "tooltip:shared legend:true"
```

---

## 堆叠柱状图

```cdl
@lang(data)
StackData {
    month,online,offline
    1月,60,40
    2月,80,50
    3月,100,60
}

# 渠道销量对比（堆叠）

## bar

## series
| field | as | type |
| --- | --- | --- |
| online | 线上渠道 | bar |
| offline | 线下渠道 | bar |

@color "#4fc3f7"  # 系列颜色会被 series 覆盖
```

---

## 关键配置说明

| 配置 | 说明 | 示例 |
|------|------|------|
| `## bar` | 图表类型 | 柱状图 |
| `group` | 分组字段（标准语法） | `group channel` |
| `stack` | 堆叠配置 | `stack true` |
| `## series` | 系列配置（高级语法） | 每系列独立颜色/样式 |
| `@color` | 默认颜色 | `#4fc3f7` |
| `@interaction` | 交互 | `tooltip:shared legend:true` |

---

## 常见场景

### 1. 横向柱状图

```cdl
# 产品销量（横向）

| 产品 | 销量 |
| --- | --- |
| A | 200 |
| B | 150 |
| C | 120 |

## bar

## axis x
min: 0
max: 250

## axis y
type: category
labelRotate: 0
```

### 2. 带数值标签

```cdl
@lang(data)
LabelData {
    product,sales
    A,200
    B,150
    C,120
}

Chart 产品销量 {
    use LabelData
    type bar
    x product
    y sales
    
    @style "showLabel:true"  # 提示渲染器显示数值
}
```

### 3. 排序显示

```cdl
# 销量排名（自动按销量降序）

| 产品 | 销量 |
| --- | --- |
| C | 120 |
| A | 200 |
| B | 150 |

## bar

## axis x
type: category  # 保持类别顺序（按数据出现顺序）
```

---

*更新日期：2026-03-14*