# 数据查询

CDL 支持多种数据源类型，从 SQL 查询到静态数据都可以定义。

## 数据源定义

### 基本结构

```cdl
@lang(sql|dax|data)
[@source('连接名')]
[@timeout(30)]
[@cache(3600)]
DataName {
    查询内容
}
```

### 元注解

| 注解 | 说明 | 示例 |
|------|------|------|
| `@lang` | 查询语言类型 | `@lang(sql)` |
| `@source` | 数据源连接名 | `@source('sales_db')` |
| `@timeout` | 查询超时(秒) | `@timeout(30)` |
| `@cache` | 缓存时间(秒) | `@cache(3600)` |

## SQL 查询

```cdl
@lang(sql)
@source('sales_db')
SalesData {
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(amount) as total
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY month
    ORDER BY month
}
```

## DAX 查询 (Power BI)

```cdl
@lang(dax)
@source('powerbi_model')
RevenueData {
    EVALUATE
    SUMMARIZE(
        Sales,
        Sales[Month],
        "Revenue", SUM(Sales[Amount]),
        "Quantity", SUM(Sales[Qty])
    )
}
```

## 静态数据

适合演示、测试或小型固定数据集：

```cdl
@lang(data)
MonthlySales {
    month,sales,profit
    1月,100,20
    2月,150,35
    3月,200,50
    4月,180,40
    5月,220,55
}
```

## 多数据源关联

```cdl
@lang(sql)
@source('sales_db')
Sales2024 {
    SELECT month, amount FROM sales WHERE year = 2024
}

@lang(sql)
@source('sales_db')
Sales2023 {
    SELECT month, amount FROM sales WHERE year = 2023
}

Chart 同比对比 {
    use Sales2024 as current
    use Sales2023 as previous
    type line
    x month
    group year
}
```

## 数据安全

CDL 的设计理念是**数据与定义分离**：

- CDL 文件只包含查询语句，不包含实际数据
- 数据权限由数据源连接控制
- 敏感信息（数据库密码等）不存储在 CDL 中
- 适合在版本控制中管理，无数据泄露风险

## 查询最佳实践

1. **限制返回列数** - 只选择图表需要的字段
2. **使用聚合** - 在数据库层完成数据汇总
3. **设置超时** - 避免长时间运行的查询
4. **合理使用缓存** - 静态数据设置较长缓存时间
