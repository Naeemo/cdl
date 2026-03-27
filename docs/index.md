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
  - title: 📝 Markdown 风格
    details: 纯 Markdown 语法，# 标题、| 表格、## 类型，3行上手
  - title: 🔒 安全交付
    details: DSL 不携带数据，权限和数据留在服务端
  - title: 🤖 AI 友好
    details: 结构化、可验证，LLM 易于生成和修改
  - title: 🎨 渐进增强
    details: 简单图表3行，复杂图表逐层添加配置
---

## 快速示例

```cdl
# 月度销售趋势

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line

@color #4fc3f7
@style smooth
```

编译后生成 ECharts 配置，直接渲染图表。

---

## 安装

```bash
npm install @cdl/compiler @cdl/renderer-echarts
```

---

*文档版本：v0.7*