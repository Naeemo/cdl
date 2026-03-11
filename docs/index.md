---
layout: home

hero:
  name: CDL
  text: 图表定义语言
  tagline: 像写 Markdown 一样定义图表
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/
    - theme: alt
      text: 在线体验
      link: /playground/

features:
  - title: 📝 简洁声明式
    details: 类似 Markdown 的语法，专注"要什么"而非"怎么实现"
  - title: 🔒 安全交付
    details: DSL 不携带数据，权限和数据留在服务端
  - title: 🤖 AI 友好
    details: 结构化、可验证，LLM 易于生成和修改
  - title: 🎨 渐进渲染
    details: 核心层必渲染，@提示层可选解析
---

## 快速示例

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

编译后生成 ECharts 配置，直接渲染图表。

## 安装

```bash
npm install @cdl/compiler @cdl/renderer-echarts
```

## 使用

```typescript
import { compile } from '@cdl/compiler'
import { render } from '@cdl/renderer-echarts'

const { result } = compile(cdlSource)
const { option } = render(result)
// option 是标准的 ECharts 配置
```
