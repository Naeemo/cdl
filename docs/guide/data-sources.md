# 数据源与查询

CDL 支持多种数据查询语言，可以从不同来源获取数据。

## 数据源类型

| 类型 | 语法 | 说明 |
|------|------|------|
| 内联数据 | `\| 表格 \|` | 直接在 CDL 中定义数据 |
| SQL | `` ` ``sql Name` | SQL 查询 |
| DAX | `` ` ``dax Name` | DAX 表达式（Power BI） |
| REST | `` ` ``rest Name` | REST API |
| WebSocket | `` ` ``ws Name` | WebSocket 流 |

---

## 内联数据（推荐用于示例）

最简单的方式，直接在 CDL 中定义：

```cdl
# 月度销售

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line
```

---

## SQL 数据源

```cdl
```sql SalesQuery
SELECT month, SUM(amount) as amount
FROM sales
WHERE year = 2024
GROUP BY month
```

# 销售分析
## bar
use SalesQuery
```

---

## DAX 数据源（Power BI）

```cdl
```dax SalesByMonth
EVALUATE
SUMMARIZE(
    Sales,
    'Date'[Month],
    "Total", SUM(Sales[Amount])
)
```

# Power BI 数据
## line
use SalesByMonth
```

---

## REST API 数据源

```cdl
```rest SalesAPI
GET https://api.example.com/data
Params: { token: 'xxx', limit: 100 }
```

# API 数据
## bar
use SalesAPI
```

---

## WebSocket 实时数据

```cdl
```ws RealtimeData
wss://api.example.com/realtime
Params: { symbol: 'AAPL' }
```

# 实时行情
## line
use RealtimeData
```

---

## 最佳实践

1. **内联数据用于示例** - 文档和示例中使用表格
2. **SQL 用于生产** - 复杂查询走数据库
3. **字段名一致** - 确保数据源字段与图表引用一致

---

## 安全性

- 避免在 CDL 中硬编码敏感信息（密码、token）
- 使用参数化查询防止注入
- REST/WebSocket 注意 CORS 和认证
- 服务端渲染时配置数据源权限

---

*文档版本：v0.7*