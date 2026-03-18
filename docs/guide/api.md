# API 参考

## 编译器 API

### `compile(source: string): CompileResult`

将 CDL 源码编译为 AST。

```typescript
import { compile } from '@cdl/compiler';

const result = compile(`
@lang(data)
Data { a,b 1,2 }

Chart { use Data type line x a y b }
`);

if (result.success) {
  console.log(result.file); // CDLFile AST
} else {
  console.error(result.errors);
}
```

### `validate(source: string): ValidationResult`

验证 CDL 语法是否正确。

```typescript
import { validate } from '@cdl/compiler';

const { valid, errors } = validate(cdlCode);
if (!valid) {
  errors.forEach(e => console.log(`Line ${e.line}: ${e.message}`));
}
```

### 类型导出

```typescript
export type {
  CDLFile,
  DataDefinition,
  ChartDefinition,
  SeriesConfig,
  AxisConfig,
  InteractionConfig,
  CompileError,
  CompileResult,
  ValidationResult
} from '@cdl/compiler';
```

## 渲染器 API

### `render(cdlFile: CDLFile, theme?: string): RenderResult`

将 AST 渲染为 ECharts option。

```typescript
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';

const { file } = compile(cdlCode);
const { success, option, error } = render(file, 'dark');

if (success) {
  // option 可以直接传给 ECharts.setOption()
  chart.setOption(option);
}
```

### `parseData(query: string): { headers: string[], rows: string[][] }`

解析内联数据表格。

```typescript
import { parseData } from '@cdl/renderer-echarts';

const { headers, rows } = parseData(`
month,amount
1月,100
2月,150
`);
```

### 类型

```typescript
export interface RenderResult {
  success: boolean;
  option?: any;      // ECharts option object
  error?: string;    // 错误信息
}
```

## AI 模块 API

### `nlToCDL(prompt: string, options?: NLOptions): CDLResult`

自然语言转 CDL。

```typescript
import { nlToCDL } from '@cdl/ai';

const result = await nlToCDL('画一个显示每月销售额的折线图', {
  language: 'zh-CN',
  chartType: 'auto'  // auto | line | bar | ...
});

console.log(result.cdl);    // 生成的 CDL 代码
console.log(result.confidence); // 置信度 0-1
```

### `suggestImprovements(cdl: string): Suggestion[]`

获取 CDL 改进建议。

```typescript
import { suggestImprovements } from '@cdl/ai';

const suggestions = await suggestImprovements(cdlCode);
suggestions.forEach(s => console.log(`${s.area}: ${s.message}`));
```

## MCP 服务器

### 启动

```bash
node packages/mcp-server/dist/server.js
```

### 协议

支持 Model Context Protocol，提供：
- `cdl/compile` - 编译 CDL
- `cdl/render` - 渲染图表
- `cdl/validate` - 验证语法
- `cdl/complete` - 代码补全
- `cdl/examples` - 列表示例

## React 组件

### `<CDLChart />`

```tsx
import { CDLChart } from '@cdl/react';

function App() {
  return (
    <CDLChart
      code={cdlString}
      theme="light"
      width="100%"
      height={400}
      onSuccess={() => console.log('rendered')}
      onError={(err) => console.error(err)}
    />
  );
}
```

### Props

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `code` | `string` | **必填** | CDL 源码 |
| `theme` | `'light' \| 'dark'` | `'light'` | 主题 |
| `width` | `number \| string` | `'100%'` | 宽度 |
| `height` | `number \| string` | `400` | 高度 |
| `onSuccess` | `() => void` | - | 渲染成功回调 |
| `onError` | `(error: string) => void` | - | 渲染失败回调 |

## 配置选项

### 编译器配置（tsconfig.json）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "declaration": true,
    "strict": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 渲染器配置

```javascript
import { configure } from '@cdl/renderer-echarts';

configure({
  defaultTheme: 'dark',
  animationDuration: 800,
  responsive: true
});
```

## 错误码

| 代码 | 说明 | 建议 |
|------|------|------|
| `UNCLOSED_BLOCK` | 缺少闭合括号 | 检查 Chart 块是否有 `}` |
| `MISSING_DATA_SOURCE` | 缺少数据源引用 | 添加 `use DataName` |
| `INVALID_SERIES_ARRAY` | series 语法错误 | 使用表格或引号包裹 |
| `FIELD_NOT_FOUND` | 字段不存在 | 检查字段名拼写 |
| `UNKNOWN_CHART_TYPE` | 图表类型不支持 | 使用支持的类型 |

## 版本兼容

| CDL 版本 | 编译器 | 渲染器 | 兼容性 |
|----------|--------|--------|--------|
| v0.1-v0.5 | `@cdl/compiler@^0.1` | `@cdl/renderer@^0.1` | 旧语法 |
| v0.6+ | `@cdl/compiler@^0.2` | `@cdl/renderer-echarts@^0.1` | 当前 |

**注意：** v0.6 引入了 series 表格、axis 块、interaction 等新特性，不向后兼容 v0.5。

## 更多资源

- [示例](./examples.md) - 查看完整示例代码
- [故障排除](./troubleshooting.md) - 常见问题解决
- [开发者指南](./developer.md) - 如何贡献代码