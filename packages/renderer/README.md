# @cdl/renderer-echarts

ECharts 渲染器，将 CDL AST 转换为 ECharts 配置选项。

## 安装

```bash
npm install @cdl/renderer-echarts @cdl/compiler
```

## 使用

```typescript
import { compile } from '@cdl/compiler'
import { render } from '@cdl/renderer-echarts'

const cdlSource = `
@lang(data)
Data { month,sales\n1月,100\n2月,150 }

Chart { use Data type line x month y sales }
`

// 编译 CDL
const { result, errors } = compile(cdlSource)
if (errors.length > 0) {
  console.error(errors)
  return
}

// 渲染为 ECharts 配置
const { option, warnings } = render(result)
console.log(option) // ECharts option 对象
```

## 完整示例

```typescript
import * as echarts from 'echarts'
import { compile } from '@cdl/compiler'
import { render } from '@cdl/renderer-echarts'

const chart = echarts.init(document.getElementById('chart'))

const cdl = `
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
    @style "平滑曲线"
    @color "#4fc3f7"
}
`

const { result } = compile(cdl)
const { option } = render(result)
chart.setOption(option)
```

## 相关

- [CDL 主仓库](https://github.com/Naeemo/cdl)
- [@cdl/compiler](https://www.npmjs.com/package/@cdl/compiler) - CDL 编译器
- [在线文档](https://naeemo.github.io/cdl/)
