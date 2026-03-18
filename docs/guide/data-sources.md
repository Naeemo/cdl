# 数据源与查询

CDL 支持多种数据查询语言，可以从不同来源获取数据。

## 数据源类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `data` | 内联数据（表格） | `Data { field1,field2 val1,val2 }` |
| `sql` | SQL 查询 | `@source('db') SELECT ...` |
| `dax` | DAX 表达式（Power BI） | `EVALUATE SUMMARIZE(...)` |
| `rest` | REST API | `@url('https://...')` |
| `websocket` | WebSocket 流 | `@url('ws://...')` |

## 内联数据（data）

最简单的方式，直接在 CDL 中定义：

```cdl
@lang(data)
Sales {
    month,amount
    1月,100
    2月,150
    3月,200
}
```

规则：
- 第一行：字段名（逗号分隔）
- 后续行：数据记录
- 数值自动识别，其他为字符串

## SQL 数据源

```cdl
@lang(sql)
@source('my_database')
@timeout(30)      // 可选：超时秒数
@cache(300)       // 可选：缓存秒数
SalesQuery {
    SELECT month, SUM(amount) as amount
    FROM sales
    WHERE year = 2024
    GROUP BY month
}
```

## DAX 数据源（Power BI）

```cdl
@lang(dax)
SalesByMonth {
    EVALUATE
    SUMMARIZE(
        Sales,
        'Date'[Month],
        "Total", SUM(Sales[Amount])
    )
}
```

## REST API 数据源

```cdl
@lang(rest)
@url('https://api.example.com/data')
@params({ token: 'xxx', limit: 100 })
SalesAPI {
    // API 返回的 JSON 字段映射
    fields: month, amount
}
```

## WebSocket 实时数据

```cdl
@lang(websocket)
@url('ws://api.example.com/realtime')
@params({ symbol: 'AAPL' })
RealtimeData {
    fields: timestamp, price, volume
}
```

## 数据源元数据

所有数据源可以添加以下注解：

- `@source(name)` - 数据源标识（用于缓存、监控）
- `@timeout(n)` - 查询超时（秒）
- `@cache(n)` - 结果缓存时间（秒）
- `@params({...})` - 查询参数（JSON 对象）

## 数据转换（即将推出）

未来将支持数据管道操作：

```cdl
@lang(data)
Raw { ... }

@transform
filter(value > 0) | sort(amount desc) | limit(10)
```

## 最佳实践

1. **内联数据用于示例** - 文档和示例中使用 `data` 类型
2. **SQL 用于生产** - 复杂查询走数据库
3. **缓存设置** - 频繁但不常变的数据设置合理缓存
4. **超时控制** - API 查询设置合理超时，避免阻塞
5. **字段名一致** - 确保数据源字段与图表引用一致

## 安全性

- 避免在 CDL 中硬编码敏感信息（密码、token）
- 使用参数化查询防止注入
- REST/WebSocket 注意 CORS 和认证
- 服务端渲染时配置数据源权限

## 故障排除

- **字段找不到** - 检查数据源字段名是否与图表引用一致
- **查询超时** - 增加 `@timeout` 或优化查询
- **缓存问题** - 调整 `@cache` 时间或清除缓存
- **API 错误** - 检查 `@url` 和 `@params` 配置