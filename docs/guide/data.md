# 数据查询

CDL 支持多种数据源类型，从 SQL 查询到静态数据都可以定义。

## 数据源定义

### 基本结构（v0.7 新语法）

```cdl
```sql DataName
SELECT * FROM table
```

或使用内联数据表格：

```cdl
# 图表标题
| 列1 | 列2 |
| --- | --- |
| 值1 | 值2 |

## line
```

---

## SQL 查询

```cdl
```sql SalesData
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    SUM(amount) as total
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY month
ORDER BY month
```

# 月度销售
## line
use SalesData
```

---

## DAX 查询 (Power BI)

```cdl
```dax RevenueData
EVALUATE
SUMMARIZE(
    Sales,
    Sales[Month],
    "Revenue", SUM(Sales[Amount]),
    "Quantity", SUM(Sales[Qty])
)
```

# 收入分析
## bar
use RevenueData
```

---

## 静态数据（内联表格）

最简单的方式，直接在 CDL 中嵌入数据：

```cdl
# 月度销售

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 100 | 20 |
| 2月 | 150 | 35 |
| 3月 | 200 | 50 |
| 4月 | 180 | 40 |
| 5月 | 220 | 55 |

## line
@color #4fc3f7
```

---

## REST API 数据源

```cdl
```rest SalesAPI
GET https://api.example.com/sales
Headers: { "Authorization": "Bearer token" }
```

# API 数据
## bar
use SalesAPI
```

---

## WebSocket 实时数据

```cdl
```ws RealtimeData
wss://api.example.com/stream
```

# 实时数据
## line
use RealtimeData
```

---

## 数据安全

CDL 的设计理念是**数据与定义分离**：

- CDL 文件只包含查询语句，不包含实际数据
- 数据权限由数据源连接控制
- 敏感信息（数据库密码等）不存储在 CDL 中
- 适合在版本控制中管理，无数据泄露风险

---

## 查询最佳实践

1. **限制返回列数** - 只选择图表需要的字段
2. **使用聚合** - 在数据库层完成数据汇总
3. **设置超时** - 避免长时间运行的查询
4. **合理使用缓存** - 静态数据设置较长缓存时间

---

*文档版本：v0.7*