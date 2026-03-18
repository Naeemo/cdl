# 故障排除

遇到问题？这里收集了常见问题和解决方案。

## 编译错误

### "Unclosed Chart block"
**原因：** Chart 块缺少闭合括号 `}`

**解决：**
```cdl
❌ Chart { type line x month y amount  // 缺少 }
✅ Chart { type line x month y amount }
```

### "Chart must have at least one data source"
**原因：** Chart 没有使用 `use DataName` 引用数据源

**解决：**
```cdl
❌ Chart { type line x month y amount }
✅ Chart { use SalesData; type line; x month; y amount }
```

### "Invalid series array syntax"
**原因：** series 数组格式错误

**解决：**
```cdl
❌ series: [销售额, 利润]  // 缺少引号
✅ series: ['销售额', '利润']  // 或使用表格语法
```

### "Field not found"
**原因：** 字段名与数据源定义不匹配

**解决：** 检查数据源字段列表，确保大小写和名称一致
```cdl
Data { month, sales }
Chart { x month; y sales }  // ✅ y 是 sales 不是 amount
```

## 渲染问题

### 图表不显示
**可能原因：**
- 数据为空或格式错误
- 容器元素尺寸为 0
- ECharts 未正确初始化

**检查：**
```javascript
console.log(option); // 查看生成的 option
console.log(chartRef.current?.offsetWidth); // 容器宽度
```

### 响应式不工作
**原因：** 缺少 `@responsive true` 或未监听 resize

**解决：**
```cdl
Chart { @responsive true }
```
```javascript
window.addEventListener('resize', () => chart.resize());
```

### 颜色不生效
**原因：** `@color` 语法错误或类型不支持

**解决：**
- 单个颜色：`@color "#ff0000"`
- 字段映射：`@color "销售额=蓝色,利润=红色"`

## 性能问题

### 编译慢
- 减少数据行数（< 1000 行）
- 使用 `@cache` 缓存查询结果
- 预聚合大数据集

### 渲染卡顿
- 关闭动画：`@animation "none"`
- 减少图表数量
- 使用 `dataZoom` 限制显示范围

### 内存泄漏
- 销毁图表时调用 `chart.dispose()`
- 避免重复 `setOption` 累积数据

## 数据源问题

### SQL 查询超时
**解决：** 增加 `@timeout(60)` 或优化查询

### REST API 失败
**检查：**
- `@url` 是否正确
- CORS 配置
- 认证信息

### WebSocket 断开
**解决：**
- 检查服务器地址
- 添加重连逻辑
- 使用 `@cache` 减少请求频率

## IDE 支持

### VS Code 语法高亮不工作
**解决：**
1. 安装 CDL VS Code 扩展
2. 文件保存为 `.cdl` 后缀
3. 重启 VS Code

### 自动补全缺失
**解决：**
- 确保 `package.json` 包含 `"cdl"` 语言配置
- 检查扩展版本

## 更多帮助

- [GitHub Issues](https://github.com/naeemo/cdl/issues) - 报告 bug
- [Discord 社区](https://discord.com/invite/clawd) - 实时讨论
- [文档](https://naeemo.github.io/cdl/) - 完整参考

如果问题未解决，请提供：
1. CDL 代码
2. 错误信息（完整）
3. 环境信息（Node 版本、浏览器等）
4. 复现步骤