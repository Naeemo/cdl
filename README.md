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

CDL（Chart Definition Language）是一种用于定义数据图表的领域特定语言（DSL）。它提供三种语法级别，满足从新手到专业开发者的不同需求：

**快速语法**（Markdown 风格）：
```cdl
# 月度销售额

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## 折线图

@color "#4fc3f7"
@style "smooth"
```

**标准语法**（显式声明）：
```cdl
@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y sales
    
    @color "#4fc3f7"
    @title "2024年销售趋势"
}
```

**高级语法**（v0.6 新增：多系列 + 坐标轴 + 交互）：
```cdl
# 销售额与利润

| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |

## combo

## series
| field | as | type | color | axis |
| --- | --- | --- | --- | --- |
| 销售额 | 销售额 | bar | #4fc3f7 | left |
| 利润 | 利润 | line | #ff9800 | right |

## axis y right
min: 0
max: 50

@interaction "tooltip:shared zoom:inside"
```

---

## ✨ 特性

- **📝 三种语法级别** - 快速/Markdown、标准、高级（满足不同场景）
- **🔒 安全交付** - DSL 不携带数据，权限和数据留在服务端
- **🤖 AI 友好** - 结构化、可验证，LLM 易于生成和修改
- **🎨 渐进渲染** - 核心层必渲染，@提示层可选解析
- **📊 16+ 图表类型** - line/bar/pie/scatter/area/radar/combo/heatmap 等
- **⚡ 极简表达** - ECharts option 的极简映射，舍弃低频配置
- **🎯 智能推断** - 从标题自动识别图表类型，自动映射字段
- **🔧 精细控制** - v0.6 新增：多系列、坐标轴、交互声明

---

## 📦 安装

```bash
npm install @cdl/compiler @cdl/renderer-echarts
```

---

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

const { result, errors } = compile(cdlSource)
if (errors.length > 0) {
    console.error('编译错误:', errors)
} else {
    const { option } = render(result)
    // option 是标准的 ECharts 配置
    // 可直接传递给 ECharts 实例
}
```

---

## 📤 导出图表

### Playground 在线导出
访问 [在线体验](https://naeemo.github.io/cdl/playground/)，编辑图表后点击 PNG/SVG 按钮导出。

### CLI 导出
```bash
# 安装 CLI
npm install -g @cdl/cli

# 验证语法
cdl validate example.cdl

# 编译输出 AST
cdl compile example.cdl --output ast.json

# 渲染并导出图片（需要 server）
cdl export example.cdl --format png --output chart.png

# AI 生成 CDL
cdl nl "月度销售额折线图，蓝色" --api-key $KIMI_API_KEY
```

### AI 自然语言生成
```bash
npm install @cdl/ai
```

```typescript
import { nlToCDL } from '@cdl/ai';

const result = await nlToCDL("最近6个月销售额折线图，蓝色", {
  apiKey: 'your-kimi-api-key'
});

if (result.success) {
  console.log(result.cdl);
}
```

### 服务端渲染 API
```bash
cd packages/ssr
npm install
npm start

# POST /api/export
# Body: { "source": "CDL代码", "format": "png" }
```

---

## 📚 文档

- [快速开始](https://naeemo.github.io/cdl/guide/) - 三种语法级别详解
- [语法规范 v0.6](https://naeemo.github.io/cdl/guide/syntax) - 完整语法参考（含高级特性）
- [数据源定义](./guide/data) - SQL/DAX/内联数据
- [图表类型](./guide/charts) - 16+ 图表类型及示例
- [在线体验](../playground/) - 实时编辑和预览
- [示例代码](../examples/) - 丰富的图表示例

---

## 🏗️ 项目结构

```
cdl/
├── packages/
│   ├── compiler/          # @cdl/compiler - CDL 编译器
│   ├── renderer-echarts/  # @cdl/renderer-echarts - ECharts 渲染器
│   ├── cli/               # @cdl/cli - 命令行工具
│   ├── ssr/               # @cdl/ssr - 服务端渲染服务
│   ├── ai/                # @cdl/ai - AI 自然语言生成
│   ├── react/             # @cdl/react - React 组件
│   └── ...
├── vscode-extension/      # VS Code 插件（语法高亮、片段）
├── docs/                  # VitePress 文档站点
├── examples/              # 示例 CDL 文件
├── schemas/               # JSON Schema（AST 定义）
├── GRAMMAR.md             # 完整语法规范（Markdown）
└── PROMPT.md              # AI 指令模板
```

---

## 🗺️ 路线图

### v0.6（进行中）
- ✅ 多系列精细控制（`## series`）
- ✅ 坐标轴配置（`## axis`）
- ✅ 交互声明（`@interaction`）
- 🔄 编译器支持
- 🔄 渲染器映射
- 🔄 文档与示例更新

### 未来规划
- 数据管道（filter/aggregate）— 不纳入 v0.6
- 主题系统 — 简化版
- 响应式布局 — 基础支持
- D3 渲染器 — 框架已就绪

---

## 🤝 贡献

欢迎 Issue 和 PR！

## 📄 许可

[MIT](LICENSE)