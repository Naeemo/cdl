# CDL - Chart Definition Language (v0.7)

像写 Markdown 一样定义图表。

## 快速开始

```cdl
# 月度销售
| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line
@color #4fc3f7
@title 销售趋势
```

## 语法

- `# 标题` - 图表名称
- `| 表格 |` - 数据
- `## 类型` - 图表类型 (line/bar/pie/...)
- `@指令` - 样式配置
- `## series` - 多系列配置
- `## axis` - 坐标轴配置

## 安装

```bash
npm install -g @cdl/cli
cdl init mychart.cdl
```
