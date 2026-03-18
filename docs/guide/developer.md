# 开发者指南

本文档面向 CDL 的贡献者和高级用户，介绍如何参与开发、扩展和集成。

## 架构概览

```
┌─────────────────────────────────────────┐
│           Application / Framework        │
├─────────────────────────────────────────┤
│  CDL Compiler  │  Renderers  │  AI      │
│  (Parser + AST)│ (ECharts/D3)│ (NL→CDL)│
├─────────────────────────────────────────┤
│     Data Sources (SQL/DAX/REST/WS)      │
└─────────────────────────────────────────┘
```

### 核心包

| 包名 | 说明 | 用途 |
|------|------|------|
| `@cdl/compiler` | 编译器 | 解析 CDL → AST |
| `@cdl/renderer-echarts` | ECharts 渲染器 | AST → ECharts option |
| `@cdl/renderer-d3` | D3 渲染器（规划中） | AST → D3 可视化 |
| `@cdl/ai` | AI 模块 | 自然语言 → CDL |
| `@cdl/mcp-server` | MCP 服务器 | AI Agent 集成 |
| `@cdl/react` | React 组件 | `<CDLChart />` |
| `@cdl/vscode-extension` | VS Code 插件 | 语法高亮、LSP |
| `@cdl/themes` | 主题包 | 预设主题集合 |

## 本地开发

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm
- Git

### 安装依赖

```bash
cd /path/to/cdl
pnpm install
```

### 构建所有包

```bash
pnpm -r build
```

### 运行测试

```bash
node packages/integration-test/test-v06.js
```

### 开发工作流

1. 修改代码
2. 构建受影响包（或 `pnpm -r build`）
3. 运行测试验证
4. 提交（遵循 Conventional Commits）
5. 推送到分支并创建 PR

## 扩展图表类型

### 1. 在渲染器中实现转换

编辑 `packages/renderer/src/renderer-v06.ts`：

```typescript
case 'newtype':
  convertNewType(chart, option, headers, rows);
  break;
```

### 2. 实现 `convertNewType` 函数

```typescript
function convertNewType(chart: any, option: any, headers: string[], rows: string[][]) {
  // 设置 option.xAxis, option.yAxis, option.series 等
  // 参考 ECharts 文档
}
```

### 3. 更新 PROMPT.md

在 "图表类型完整列表" 中添加新类型，说明必需字段和使用场景。

### 4. 添加示例

在 `examples/newtype/` 目录下创建至少 3 个 `.cdl` 示例文件。

### 5. 更新文档

在 `docs/guide/charts-reference.md` 中记录新类型。

## 贡献代码

### Commit 规范

使用 Conventional Commits：

- `feat:` 新功能
- `fix:` bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具变更

示例：
```bash
git commit -m "feat(renderer): add support for treemap chart type"
```

### PR 流程

1. Fork 仓库
2. 创建特性分支
3. 提交更改
4. 推送到 fork
5. 创建 PR 到 `naeemo:main`
6. 等待 CI 和审查
7. 根据反馈修改
8. Squash merge

### CI/CD

- 自动运行 TypeScript 编译检查
- 运行集成测试
- 文档自动部署到 GitHub Pages

确保所有检查通过才能合并。

## 添加新功能

### 新 @hints

1. 在 `packages/compiler/src/types.ts` 的 `ChartHint` 接口中添加字段
2. 在 `packages/renderer/src/renderer-v06.ts` 中读取并使用该字段
3. 更新 `PROMPT.md` 文档
4. 添加示例和测试

### 新数据源类型

1. 在 `QueryLanguage` 类型中添加新类型
2. 在 `parseV05` 中添加解析逻辑
3. 考虑缓存、超时等配置
4. 添加示例

## 集成到其他框架

### Vue 组件

```vue
<template>
  <div ref="chart" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';
import * as echarts from 'echarts';

const props = defineProps(['code', 'theme']);
const chartRef = ref(null);

onMounted(() => {
  const result = compile(props.code);
  const option = render(result.file, props.theme);
  const chart = echarts.init(chartRef.value);
  chart.setOption(option);
});
</script>
```

## 调试技巧

### 查看 AST

```javascript
const { parseV05 } = require('@cdl/compiler');
const ast = parseV05(cdlCode);
console.log(JSON.stringify(ast, null, 2));
```

### 查看渲染过程

```javascript
import { render } from '@cdl/renderer-echarts';
const result = render(ast.file);
console.log(result.option);
```

### 性能分析

```javascript
console.time('compile');
compile(cdlCode);
console.timeEnd('compile');

console.time('render');
render(file);
console.timeEnd('render');
```

## 测试指南

### 添加新测试

编辑 `packages/integration-test/test-v06.js`，添加测试用例：

```javascript
console.log('Testing new feature...');
const result = compile(`...`);
if (!result.success || result.errors.length > 0) {
  throw new Error('New feature failed');
}
console.log('✓ new feature works');
```

### 覆盖率

使用 `c8` 或 `nyc` 检查测试覆盖率，目标 > 80%。

## 发布流程

1. 更新版本号（`packages/*/package.json`）
2. 更新 CHANGELOG
3. 构建所有包：`pnpm -r build`
4. 提交版本 bump
5. 创建 GitHub Release
6. 发布到 npm：`pnpm -r publish`

## 获取帮助

- [Discord](https://discord.com/invite/clawd) - 实时讨论
- [GitHub Issues](https://github.com/naeemo/cdl/issues) - 报告 bug
- [文档](https://naeemo.github.io/cdl/) - 完整参考

---

**欢迎贡献！** 任何改进，无论是修复错字还是添加新功能，都非常感谢。