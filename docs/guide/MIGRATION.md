# MIGRATION.md - 从旧版本迁移

CDL v0.6 引入了多项新特性，与 v0.5 及更早版本不完全兼容。

## 主要变化

### 1. 图表定义语法

**v0.5 及更早：**
```cdl
Chart 名称 {
    type line
    x month
    y amount
    series [销售额, 成本]  // ❌ 不再支持
}
```

**v0.6+：**
```cdl
Chart 名称 {
    use DataName      // ✅ 必须明确引用数据源
    type line
    x month
    y amount
    
    // 多系列使用 ## series 表格
    ## series
    | field | as | type |
    | --- | --- | --- |
    | sales | 销售额 | line |
    | cost | 成本 | line |
}
```

### 2. 数据源引用

**旧版：** 数据块自动命名为图表名加 `_data`
**新版：** 必须显式使用 `use DataName` 引用已定义的数据源

### 3. series 语法

**旧版：** `series: [field1, field2]`（内联数组）
**新版：** `## series` 块（Markdown 表格）

### 4. 坐标轴配置

**旧版：** 无直接支持多轴
**新版：** `## axis x`、`## axis y`、`## axis y2` 块

### 5. 交互配置

**旧版：** `interaction: {...}` 内联对象
**新版：** `@interaction "key:value"` 或 `## interaction` 块

## 迁移步骤

### 步骤 1：更新数据源

确保每个数据块有明确名称：

```cdl
@lang(data)
Sales2024 { ... }  // ✅ 有名称
```

### 步骤 2：添加 use 语句

在每个 Chart 中添加 `use DataName`：

```cdl
Chart {
    use Sales2024  // ✅ 添加这行
    type line
    ...
}
```

### 步骤 3：转换 series

将数组语法转换为表格：

```cdl
// 旧
series: [sales, profit]

// 新
## series
| field | as | type |
| --- | --- | --- |
| sales | 销售额 | bar |
| profit | 利润 | line |
```

### 步骤 4：配置多轴（如需要）

```cdl
## axis y2
name: 利润率
min: 0
max: 100
```

### 步骤 5：更新交互

```cdl
// 旧
interaction: { tooltip: 'shared', zoom: 'inside' }

// 新
@interaction "tooltip:shared zoom:inside"
```

## 兼容性工具

### 自动迁移脚本

运行迁移助手（待开发）：

```bash
node packages/migration/upgrade-v0.5-to-v0.6.js input.cdl > output.cdl
```

### 验证工具

```bash
node packages/integration-test/test-v06.js
```

确保迁移后的 CDL 通过 v0.6 测试。

## 常见问题

**Q: 迁移后图表不显示了？**  
A: 检查是否添加了 `use DataName`，以及 series 表格是否正确。

**Q: 多轴不工作？**  
A: 确保 combo 图表定义了 `## axis y2`，且 series 中的 `axis` 字段指向正确。

**Q: 颜色丢失？**  
A: v0.6 颜色配置方式可能变化，检查 `@color` 或 series 表格中的 color 列。

## 回滚

如果遇到问题，可以：
1. 保留旧版本 CDL 文件
2. 使用 v0.5 渲染器（不推荐）
3. 逐步迁移，每个图表单独验证

## 获取帮助

- [GitHub Issues](https://github.com/naeemo/cdl/issues)
- [Discord 社区](https://discord.com/invite/clawd)

## 完整示例对比

### v0.5
```cdl
@lang(data)
Sales { month,amount 1月,100 2月,150 }

Chart {
    type line
    x month
    y amount
    series [sales, profit]
    interaction "tooltip:shared"
}
```

### v0.6+
```cdl
@lang(data)
SalesData { month,amount 1月,100 2月,150 }
ProfitData { month,profit 1月,15 2月,20 }

Chart 销售与利润 {
    use SalesData
    type combo
    
    ## series
    | field | as | type |
    | --- | --- | --- |
    | amount | 销售额 | line |
    | profit | 利润 | line |
    
    ## axis y2
    name: 利润
    min: 0
    
    @interaction "tooltip:shared"
}
```