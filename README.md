# CDL

<p align="center">
  <strong>Chart Definition Language</strong><br>
  像写 Markdown 一样定义图表
</p>

<p align="center">
  <a href="https://naeemo.github.io/cdl/">📖 文档</a> •
  <a href="https://naeemo.github.io/cdl/playground/">🎮 在线体验</a> •
  <a href="https://naeemo.github.io/cdl/guide/">🚀 快速开始</a>
</p>

---

## 什么是 CDL

CDL（Chart Definition Language）是一种用于定义数据图表的领域特定语言（DSL）。

```cdl
@lang(sql)
@source('sales_db')
SalesData {
    SELECT month, amount FROM sales
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y amount
    
    @style "平滑曲线"
    @color "#4fc3f7"
}
```

## ✨ 特性

- **📝 简洁声明式** - 类似 Markdown 的语法，专注"要什么"而非"怎么实现"
- **🔒 安全交付** - DSL 不携带数据，权限和数据留在服务端
- **🤖 AI 友好** - 结构化、可验证，LLM 易于生成和修改
- **🎨 渐进渲染** - 核心层必渲染，@提示层可选解析

## 📦 安装

```bash
npm install @cdl/compiler @cdl/renderer-echarts
```

## 🚀 快速使用

```typescript
import { compile } from '@cdl/compiler'
import { render } from '@cdl/renderer-echarts'

const cdlSource = `
@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
}

Chart {
    use SalesData
    type line
    x month
    y sales
}
`

const { result } = compile(cdlSource)
const { option } = render(result)
// option 是标准的 ECharts 配置
```

## 📚 文档

- [快速开始](https://naeemo.github.io/cdl/guide/) - 了解 CDL 基础概念和语法
- [语法规范](https://naeemo.github.io/cdl/guide/syntax) - 完整的语法参考
- [数据查询](https://naeemo.github.io/cdl/guide/data) - 数据源定义和查询
- [图表类型](https://naeemo.github.io/cdl/guide/charts) - 支持的图表类型详解
- [在线体验](https://naeemo.github.io/cdl/playground/) - 实时编辑和预览
- [示例](https://naeemo.github.io/cdl/examples/line) - 丰富的图表示例

## 🏗️ 项目结构

```
cdl/
├── packages/
│   ├── compiler/          # CDL 编译器 - 将 CDL 编译为 AST
│   └── renderer-echarts/  # ECharts 渲染器 - 将 AST 转为 ECharts 配置
├── docs/                  # VitePress 文档站点
├── examples/              # 示例 CDL 文件
└── .github/workflows/     # GitHub Actions 部署配置
```

## 🤝 贡献

欢迎 Issue 和 PR！

## 📄 许可

[MIT](LICENSE)
