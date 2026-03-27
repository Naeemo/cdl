# CDL 快速入门

## 什么是 CDL？

CDL (Chart Definition Language) 是一种声明式图表定义语言，让你像写 Markdown 一样定义图表。

## 5 分钟上手

### 1. 定义数据

```cdl
| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |
| 4月 | 180 |
```

### 2. 定义图表

```cdl
# 销售趋势

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line
@color #4fc3f7
@title 2024年销售趋势
```

### 3. 渲染

```javascript
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';

const cdlCode = `...`; // 上面的 CDL 代码
const { file } = compile(cdlCode);
const { option } = render(file);

// 使用 ECharts 渲染
chart.setOption(option);
```

---

## 核心概念

### 1. 标题 `#`

```cdl
# 月度销售趋势
```
一级标题定义图表名称。

### 2. 数据 `| 表格 |`

```cdl
| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 100 | 15 |
```
Markdown 表格格式。

### 3. 图表类型 `##`

```cdl
## line   # 折线图
## bar    # 柱状图
## pie    # 饼图
## combo  # 组合图
```

### 4. 样式 `@`

```cdl
@color #4fc3f7
@style smooth
@theme dark
```

---

## 安装

```bash
npm install @cdl/compiler @cdl/renderer-echarts
```

CLI 工具：
```bash
npm install -g @cdl/cli
cdl init mychart.cdl  # 创建示例图表
```

---

## 下一步

- [语法规范](./syntax.md) - 完整语法参考
- [示例](../examples/index.md) - 各种图表类型示例
- [最佳实践](./best-practices.md) - 进阶使用技巧

---

*文档版本：v0.7*