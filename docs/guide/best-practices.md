# 最佳实践

本文档收集了使用 CDL 的最佳实践，帮助你写出高质量、可维护的图表定义。

## 代码组织

### 1. 分离数据与逻辑

将数据定义和图表定义分开，便于复用：

```cdl
// data.cdl
@lang(data)
SalesData {
    month,region,amount
    1月,华北,100
    1月,华南,150
    ...
}

// charts/sales-line.cdl
Chart {
    use SalesData
    type line
    x month
    y amount
    group region
}
```

### 2. 使用有意义的数据源名称

❌ 不好：
```cdl
@Data { ... }
```

✅ 好：
```cdl
@lang(data)
MonthlySales2024 { ... }
```

### 3. 图表命名清晰

```cdl
Chart 2024年分区域月度销售额趋势 { ... }
```

避免：
```cdl
Chart chart1 { ... }
```

## 性能优化

### 4. 控制数据量

实时渲染建议 < 1000 行。大数据集：
- 使用 SQL 聚合：`SELECT ... GROUP BY ... LIMIT 1000`
- 分页：多个图表分次加载
- 数据采样：`LIMIT` 或 `WHERE` 过滤

### 5. 善用缓存

```cdl
@lang(sql)
@source('sales_db')
@cache(300)  // 缓存 5 分钟，减少重复查询
Sales {
    SELECT month, amount FROM sales WHERE year = 2024
}
```

### 6. 简化复杂图表

避免单图表过度复杂：
- combo 不超过 3 个系列
- sankey/treemap 数据点 < 100
- 动画时长 < 2000ms

### 7. 响应式设计

使用 `@responsive true` 适配不同设备：

```cdl
Chart {
    @responsive true
    // ...
}
```

并在宿主环境中监听 resize：

```javascript
window.addEventListener('resize', () => chart.resize());
```

## 可维护性

### 8. 添加注释

```cdl
// 2024 年各区域月度销售数据（单位：万元）
@lang(sql)
@source('sales_dw')
MonthlySales {
    SELECT month, region, amount
    FROM sales
    WHERE year = 2024
}
```

### 9. 统一风格

团队内约定：
- 字段命名规范（英文/中文？蛇形/驼峰？）
- 图表命名格式（"业务+时间+维度"？）
- 颜色使用规范（品牌色优先）

### 10. 版本控制 CDL

将 CDL 文件纳入 Git：
- 一个图表一个 `.cdl` 文件
- 使用目录结构组织：`charts/sales/`, `charts/marketing/`
- 提交信息：`feat(chart): 添加 Q1 销售趋势图`

## 错误处理

### 11. 验证 CDL

渲染前验证：

```typescript
import { validate } from '@cdl/compiler';

const { valid, errors } = validate(cdlCode);
if (!valid) {
  // 显示错误给用户或记录日志
  console.error('Invalid CDL:', errors);
}
```

### 12. 捕获渲染异常

```typescript
try {
  const { option } = render(file);
  chart.setOption(option);
} catch (err) {
  console.error('Render failed:', err);
  // 降级：显示数据表格或占位符
}
```

## 安全性

### 13. 避免注入

SQL 使用参数化查询，CDL 本身不执行查询，但数据源字符串需谨慎：

```cdl
// ❌ 危险：直接拼接用户输入
@lang(sql)
@source('db')
Data { SELECT * FROM table WHERE id = ${userId} }  // ❌

// ✅ 安全：使用参数（需服务端支持）
@lang(rest)
@url('/api/data')
@params({ id: userId })
Data { ... }
```

### 14. 限制资源访问

服务端渲染时，限制可访问的数据源和 API：

```javascript
// 白名单机制
const ALLOWED_SOURCES = ['sales_db', 'marketing_db'];
if (!ALLOWED_SOURCES.includes(sourceName)) {
  throw new Error('Unauthorized data source');
}
```

## 协作

### 15. 使用示例库

在 `examples/` 目录维护常用图表模板，团队共享。

### 16. 文档化配置

为业务特定的 @hints 或数据源配置编写文档。

### 17. 代码审查清单

PR 检查点：
- [ ] CDL 语法正确（通过 `validate`）
- [ ] 字段名与数据源一致
- [ ] 图表类型选择合理
- [ ] 添加了 `@title`
- [ ] 响应式配置（如需要）
- [ ] 性能影响评估

## AI 生成

### 18. 优化 Prompt

使用详细的需求描述：
```text
"创建一个显示 2024 年每月销售额的折线图，X 轴是月份，Y 轴是销售额，数据来源是 sales_data 表"
```

而不是：
```text
"画个图表"
```

### 19. 迭代优化

AI 生成的 CDL 可能需要调整：
1. 检查字段名是否匹配数据源
2. 验证图表类型是否合适
3. 添加样式和交互配置
4. 性能测试

### 20. 使用 `@interaction` 增强

```cdl
Chart {
    @interaction "tooltip:shared zoom:inside"
}
```

提升用户体验。

## 监控与运维

### 21. 记录编译指标

```typescript
console.time('cdl-compile');
const { file } = compile(cdlCode);
console.timeEnd('cdl-compile');
```

### 22. 错误上报

收集渲染失败错误，识别常见问题。

### 23. A/B 测试

对关键图表尝试不同配置，评估效果。

## 总结

遵循这些最佳实践，可以：
- ✅ 提升性能（快速渲染）
- ✅ 提高可维护性（代码清晰）
- ✅ 保障安全（无注入风险）
- ✅ 改善协作（团队规范）
- ✅ 优化体验（交互友好）

## 参考

- [语法规范](./syntax.md)
- [API 参考](./api.md)
- [故障排除](./troubleshooting.md)