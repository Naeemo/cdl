# 组合图示例（v0.6）

组合图（Combo）允许在同一图表中混合不同类型的系列（如柱状图 + 折线图），常用于双轴对比（如销量 vs 利润率）。

## 基础组合图（双 Y 轴）

```cdl
# 销售额与利润率

| 月份 | 销售额 | 利润率 |
| --- | --- | --- |
| 1月 | 120 | 12% |
| 2月 | 150 | 13% |
| 3月 | 180 | 14% |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left | solid |
| 利润率 | 利润率(%) | line | #ff9800 | right | smooth |

@color "#4fc3f7"
@title "月度销售额与利润率"
```

**输出效果**：
- 柱状图（蓝色）：销售额，左 Y 轴
- 折线图（橙色）：利润率，右 Y 轴
- 共享 X 轴（月份）

---

## 多系列组合图

```cdl
# 多渠道销售分析

| 月份 | 线上销售 | 线下销售 | 总利润 |
| --- | --- | --- | --- |
| 1月 | 60 | 40 | 15 |
| 2月 | 80 | 50 | 18 |
| 3月 | 100 | 60 | 22 |

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 线上销售 | 线上(万元) | bar | #4fc3f7 | left | solid |
| 线下销售 | 线下(万元) | bar | #29b6f6 | left | solid |
| 总利润 | 利润(万元) | line | #ff9800 | right | smooth |

@interaction "tooltip:shared zoom:inside"
```

**说明**：
- 前两个系列都使用左轴（堆叠或分组取决于 `stack` 配置）
- 第三个系列使用右轴
- 提示框共享（`tooltip:shared`）

---

## 标准语法（Chart {} 块）

如果你更喜欢显式声明：

```cdl
@lang(sql)
@source('sales_db')
SalesAndProfit {
    SELECT 
        month,
        SUM(sales) as sales,
        SUM(profit) as profit
    FROM monthly_summary
    GROUP BY month
}

Chart 销售分析 {
    use SalesAndProfit
    type combo
    x month
    
    // 系列配置（标准语法中通过 series 子句）
    series {
        sales as "销售额" type bar color "#4fc3f7" axis left
        profit as "利润" type line color "#ff9800" axis right
    }
    
    @title "销售与利润"
}
```

> **注意**：标准语法的 `series {}` 子句尚在规划中，当前推荐使用 `## series` 表格。

---

## 坐标轴配置

组合图常需要精细控制坐标轴：

```cdl
## axis y
min: 0
max: 200
labelFormatter: "${value}万"
splitLine: true

## axis y2
min: 0
max: 50
labelFormatter: "${value}%"
position: right
```

**配置项**：
- `min` / `max`：数值范围
- `labelFormatter`：标签格式化（支持 `${value}` 插值）
- `splitLine`：是否显示网格线
- `position`：位置（`left` / `right`）

---

## 交互行为

组合图支持缩放和提示：

```cdl
@interaction "tooltip:shared zoom:inside"
```

**选项**：
- `tooltip:shared` - 提示框显示所有系列
- `zoom:inside` - 鼠标滚轮缩放（或 `zoom:slider` 底部滑块）

---

## 常见问题

### Q1: 如何让两个柱状系列堆叠而不是并列？

```cdl
Chart {
    ...
    stack: true  // 或 stack: "total"
}
```

### Q2: 如何调整系列顺序？

`## series` 表格中的顺序决定渲染顺序（后画的覆盖先画的）。

### Q3: 可以在 combo 中使用面积图吗？

可以，`type` 支持所有图表类型：
```cdl
| field | type |
| --- | --- |
| 销量 | area |
| 增长率 | line |
```

---

## 完整示例（带主题和数据源）

```cdl
@lang(sql)
@source('analytics_db')
MonthlyData {
    SELECT 
        DATE_FORMAT(month, '%Y-%m') as month,
        SUM(online_sales) as online,
        SUM(offline_sales) as offline,
        AVG(profit_rate) as profit_rate
    FROM sales_summary
    WHERE year = 2024
    GROUP BY month
}

# 2024年销售分析

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| online | 线上(万元) | bar | #4fc3f7 | left | solid |
| offline | 线下(万元) | bar | #29b6f6 | left | solid |
| profit_rate | 利润率(%) | line | #ff9800 | right | smooth |

## axis x
labelRotate: 45

## axis y
min: 0
max: 500
labelFormatter: "${value}万"

## axis y2
min: 0
max: 30
labelFormatter: "${value}%"

@theme "dark"
@interaction "tooltip:shared zoom:inside brush:true"
```

---

**v0.6 新特性总结**：
- ✅ `## series` 表格：精细控制每个系列
- ✅ `## axis` 块：坐标轴范围、格式化
- ✅ `@interaction`：缩放、提示、刷选