# @cdl/compiler

CDL (Chart Definition Language) 编译器，将 CDL 代码编译为类型化的 JSON AST。

## 安装

```bash
npm install @cdl/compiler
```

## 使用

```typescript
import { compile } from '@cdl/compiler'

const cdlSource = `
@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
}

Chart {
    use SalesData
    type line
    x month
    y sales
}
`

const { result, errors } = compile(cdlSource)
if (errors.length === 0) {
  console.log(result) // CDL AST
}
```

## API

### `compile(source: string): CompileResult`

编译 CDL 源代码，返回 AST 或错误信息。

## 相关

- [CDL 主仓库](https://github.com/Naeemo/cdl)
- [@cdl/renderer-echarts](https://www.npmjs.com/package/@cdl/renderer-echarts) - ECharts 渲染器
