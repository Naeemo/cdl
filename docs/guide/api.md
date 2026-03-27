# API 参考

## 编译器 API

### `compile(source: string): CompileResult`

将 CDL 源码编译为 AST。

```typescript
import { compile } from '@cdl/compiler';

const result = compile(`
# 月度销售

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |

## line
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

---

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

### 类型

```typescript
export interface RenderResult {
  success: boolean;
  option?: any;      // ECharts option object
  error?: string;    // 错误信息
}
```

---

## AI 模块 API

### `nlToCDL(prompt: string, options?: NLOptions): CDLResult`

自然语言转 CDL。

```typescript
import { nlToCDL } from '@cdl/ai';

const result = await nlToCDL('画一个显示每月销售额的折线图', {
  language: 'zh-CN',
  chartType: 'auto'
});

console.log(result.cdl);    // 生成的 CDL 代码
console.log(result.confidence); // 置信度 0-1
```

---

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

---

## 错误码

| 代码 | 说明 | 建议 |
|------|------|------|
| `EXPECTED_TABLE` | 缺少数据表格 | 添加 `\| 列名 \|` 表格 |
| `EXPECTED_CHART_TYPE` | 缺少图表类型 | 添加 `## line/bar/...` |
| `FIELD_NOT_FOUND` | 字段不存在 | 检查字段名拼写 |
| `UNKNOWN_CHART_TYPE` | 图表类型不支持 | 使用支持的类型 |

---

## 版本兼容

| CDL 版本 | 编译器 | 渲染器 | 语法 |
|----------|--------|--------|------|
| v0.7 | `@cdl/compiler@^0.3` | `@cdl/renderer-echarts@^0.2` | Markdown 风格 |
| v0.6 | `@cdl/compiler@^0.2` | `@cdl/renderer-echarts@^0.1` | Chart {} 块（已废弃） |

**注意：** v0.7 完全重构为 Markdown 风格语法，不兼容 v0.6。

---

*文档版本：v0.7*