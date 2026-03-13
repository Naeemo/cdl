# CDL 项目综合状态报告
**Generated**: 2026-03-13  
**Source**: Codebase analysis + .memory/ documents  
**Status**: Production-ready with active development

---

## 🎯 项目概览

**CDL (Chart Definition Language)** - 像写 Markdown 一样定义图表

- **定位**: AI-first 图表定义 DSL，数据与表现分离
- **许可证**: MIT
- **作者**: Naeemo <naeemo@qq.com>
- **仓库**: https://github.com/naeemo/cdl
- **在线体验**: https://naeemo.github.io/cdl/playground/

---

## 🏗️ 架构与组件状态

### 核心包（Production Ready ✅）

| 包名 | 版本 | 状态 | 功能 |
|------|------|------|------|
| `@cdl/compiler` | 0.1.0 | ✅ 完成 | CDL 源码 → 类型安全 AST |
| `@cdl/renderer-echarts` | 0.1.0 | ✅ 完成 | AST → ECharts 配置 |
| `@cdl/cli` | 0.1.0 | ✅ 完成 | 命令行工具（compile/export/validate/nl）|
| `@cdl/server` | 0.1.0 | ✅ 完成 | 服务端渲染 API (PNG/SVG) |
| `@cdl/nl-codegen` | 0.1.0 | ✅ 完成 | 自然语言转 CDL |

### 渲染器支持

| 渲染器 | 状态 | 图表类型 |
|--------|------|---------|
| ECharts | ✅ 完整 | 16+ 类型 (line, bar, pie, scatter, area, combo, radar, heatmap, gauge, candlestick, boxplot, sankey, treemap, wordcloud, liquid, map) |
| D3 | ⏳ 规划中 | - |
| Canvas | ✅ 基础 | - |

### 开发者工具

| 工具 | 状态 | 描述 |
|------|------|------|
| VS Code 插件 | ✅ 完成 | 语法高亮、智能提示、片段补全、预览 |
| VitePress 文档 | ✅ 完成 | 完整文档站点 + Playground |
| MCP Server | ✅ 完成 | 为 AI 助手提供的工具定义 |
| 主题系统 | ✅ 完成 | light/dark 主题支持 |

---

## 📦 Monorepo 结构

```
cdl/
├── packages/
│   ├── compiler/          # @cdl/compiler
│   ├── renderer/          # @cdl/renderer-echarts
│   ├── cli/               # @cdl/cli
│   ├── server/            # @cdl/server
│   ├── nl-codegen/        # @cdl/nl-codegen
│   ├── renderer-d3/       # (planned)
│   ├── templates/         # 模板系统
│   └── themes/            # 主题配置
├── vscode-extension/      # VS Code 插件
├── docs/                  # VitePress 文档 + Playground
├── examples/              # 54+ 示例文件
│   ├── sql/              # 20 个 SQL 示例
│   ├── dax/              # 12 个 DAX 示例
│   └── data/             # 22 个裸数据示例
├── schemas/
│   └── ast.json          # CDL AST JSON Schema
├── mcp-server.json       # MCP 工具定义
├── PROMPT.md             # AI 指令模板
├── pnpm-workspace.yaml   # pnpm workspace 配置
├── pnpm-lock.yaml        # 依赖锁定
└── README.md             # 项目介绍

```

---

## 💻 核心技术栈

- **语言**: TypeScript (ES2020+)
- **包管理**: pnpm 8.x (monorepo)
- **运行时**: Node.js 18+
- **文档**: VitePress 1.x
- **渲染引擎**: ECharts 5.x
- **构建**: tsc (TypeScript Compiler)
- **测试**: ts-node + jest (部分)
- **服务端**: Express + Puppeteer (用于图片导出)

---

## 📚 语法规范 v0.1（已实现 ✅）

### 数据源定义

```cdl
@lang(sql|dax|data)
[@source('连接名')]
[@timeout(30)]
[@cache(3600)]
[@params({...})]
DataName {
    查询内容或CSV数据
}
```

### 图表定义

```cdl
Chart [Name] {
    use DataName [as alias]
    type line|bar|pie|...
    x field_name
    y field_name
    [group field_name]
    [stack true|field]
    [where condition]
    
    # @提示层（可选）
    @style "描述"
    @color "#hex"
    @animation "效果"
    @title "标题"
}
```

### 支持特性

- ✅ 三种查询语言: SQL, DAX, 裸数据
- ✅ 核心属性: type, x, y, group, stack, where
- ✅ @提示层: style, color, animation, interaction, title, layout
- ✅ 注释: // 和 /* */
- ✅ 数据源配置: source, timeout, cache, params
- ✅ 多数据源引用

---

## 🚀 功能清单

### 已实现 ✅

#### P0: 基础导出
- [x] Playground PNG/SVG 导出（浏览器端 canvas）
- [x] CLI 导出命令 (`cdl export`)
- [x] 服务端渲染 API (PNG/PDF via Puppeteer)
- [x] 批量导出 (`cdl batch`)

#### P1: 更多数据源
- [x] REST API 数据源 (@lang(rest))
- [x] WebSocket 数据源 (@lang(websocket))
- [x] CSV 上传/粘贴支持

#### P2: 服务端增强
- [x] 定时任务生成报告
- [x] 批量导出服务
- [x] 缓存层

#### P3: 实时数据
- [x] WebSocket 数据推送
- [x] Playground 自动刷新

#### P4: 生态工具
- [x] D3 渲染器框架 (packages/renderer-d3 存在)
- [x] 主题系统 (light/dark + 自定义)
- [x] 模板系统 (packages/templates)

#### P5: 开发者体验
- [x] 错误提示增强（友好提示 + 修复建议 + 源码上下文）
- [x] VS Code 智能提示（自动补全、悬停文档、实时诊断）
- [x] Playground 保存分享（URL 参数、分享链接、iframe 嵌入）
- [x] CLI 体验改进（直接导出 PNG、模板创建、preview 服务器）
- [x] 调试工具（--ast、--verbose、详细验证）

#### P6: 生态建设（当前重点）
- [x] NPM 包结构准备
- [ ] GitHub Actions 自动发布（等待 Secret 配置）
- [ ] React/Vue 组件封装
- [x] MCP Server 集成
- [x] AI 指令模板 (PROMPT.md)

### 待完成 ⏳

- [ ] NPM 自动发布流水线（需要配置 GitHub Secrets）
- [ ] React 组件 `<CDLChart />`
- [ ] Vue 组件 `<CDLChart />`
- [ ] D3 渲染器完整实现
- [ ] 数据连接池（SQL 数据源连接管理）
- [ ] 图表模板市场（分享和复用）
- [ ] 更多图表类型（树图、桑基图等扩展）

---

## 🛠️ 使用指南

### 安装

```bash
# 使用 npm（推荐）
npm install @cdl/compiler @cdl/renderer-echarts

# 或使用 pnpm
pnpm add @cdl/compiler @cdl/renderer-echarts
```

### 快速开始

```typescript
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';

const cdlSource = `
@lang(data)
SalesData {
    month,amount
    1月,100
    2月,150
    3月,200
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y amount
    @color "#4fc3f7"
}
`;

const { result, errors } = compile(cdlSource);
if (result) {
  const { option } = render(result);
  // option 是标准的 ECharts 配置，可直接使用
  console.log(JSON.stringify(option, null, 2));
}
```

### CLI 使用

```bash
# 编译
cdl compile example.cdl

# 渲染
cdl render example.cdl

# 导出 PNG
cdl export example.cdl --format png --output chart.png

# 验证
cdl validate example.cdl

# 自然语言生成
cdl nl "月度销售折线图，蓝色" --api-key $KIMI_API_KEY

# 批量导出
cdl batch ./reports --format pdf --output ./pdfs
```

### 服务端 API

```bash
cd packages/server
npm install
npm start
```

```http
POST /api/export
Content-Type: application/json

{
  "source": "CDL 源码",
  "format": "png|svg|pdf"
}
```

---

## 📖 示例库

项目包含 **54+ 个示例片段**，覆盖：

- **SQL 查询** (20 个): 月度销售、区域对比、品类占比、趋势分析等
- **DAX 表达式** (12 个): Power BI 度量值、时间智能计算等
- **裸数据** (22 个): 快速原型、静态数据集

示例目录：`examples/sql/`, `examples/dax/`, `examples/data/`

---

## 🔮 近期完成（2026-03-12 ~ 13）

- ✅ 完成 NL-to-CDL 核心包和 Playground 集成
- ✅ 修复 GitHub Actions CI（npm 替换 pnpm 问题）
- ✅ 完成 VS Code 插件基础功能（语法高亮 + 片段）
- ✅ MCP Server 工具定义
- ✅ AI 指令模板 (PROMPT.md)
- ✅ 数据转换管道（filter, map, aggregate, sort, limit）
- ✅ 错误提示增强系统

---

## 📋 待办事项

### 高优先级
- [ ] 完成 GitHub Actions 自动发布（配置 Secrets）
- [ ] React/Vue 组件封装
- [ ] 完善 D3 渲染器实现

### 中优先级
- [ ] 数据连接池管理（SQL 数据源）
- [ ] 更多图表类型的深度优化
- [ ] 性能分析和基准测试工具

### 低优先级
- [ ] 图表模板市场
- [ ] 社区贡献指南
- [ ] 更多语言本地化

---

## 🤝 贡献

欢迎 Issue 和 Pull Request！

开发环境设置：
```bash
git clone https://github.com/naeemo/cdl.git
cd cdl
pnpm install
pnpm -r build
```

---

## 📄 许可证

MIT - 详见 [LICENSE](LICENSE) 文件

---

*本文档自动生成于 2026-03-13，基于代码仓库实际状态*
