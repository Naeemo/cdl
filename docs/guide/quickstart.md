# CDL 快速入门

## 什么是 CDL？

CDL (Chart Definition Language) 是一种声明式图表定义语言，让你像写 Markdown 一样定义图表。

## 5 分钟上手

### 1. 定义数据

```cdl
@lang(data)
SalesData {
    month,amount
    1月,100
    2月,150
    3月,200
    4月,180
}
```

### 2. 定义图表

```cdl
Chart 销售趋势 {
    use SalesData
    type line
    x month
    y amount
}
```

### 3. 渲染

```javascript
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';

const cdlCode = `...`; // 上面的 CDL 代码
const result = compile(cdlCode);
const option = render(result.file);
// option 可以直接传给 ECharts.setOption()
```

## 核心概念

- **数据与表现分离**：CDL 只定义结构和样式，不包含实际业务逻辑
- **渐进渲染**：核心层必须，@提示层可选
- **AI 友好**：结构化语法，易于 LLM 生成和修改

## 下一步

- 阅读 [语法详解](syntax.md) 了解完整语法
- 查看 [图表类型](charts.md) 选择合适的图表
- 浏览 [示例](https://naeemo.github.io/cdl/examples/) 获取灵感

## 常见问题

**Q: 数据可以来自数据库吗？**  
A: 可以！使用 `@lang(sql)` 或 `@lang(dax)`，然后提供查询语句。

**Q: 图表可以交互吗？**  
A: 支持！使用 `@interaction` 配置 tooltip、zoom、brush 等。

**Q: 响应式支持？**  
A: 添加 `@responsive true` 即可，图表会自动适应容器尺寸。