# 图表类型完整参考

CDL 支持 20+ 种图表类型，所有类型都基于 ECharts 实现。

## 类型列表

### 基础图表

| 类型 | 说明 | 必需字段 | 适用场景 |
|------|------|----------|----------|
| `line` | 折线图 | x, y | 趋势、时间序列 |
| `bar` | 柱状图 | x, y | 对比、排名 |
| `pie` | 饼图 | x, y | 占比、构成 |
| `scatter` | 散点图 | x, y | 相关性、分布 |

### 高级图表

| 类型 | 说明 | 必需字段 | 特殊配置 |
|------|------|----------|----------|
| `area` | 面积图 | x, y | 支持 `stack` |
| `radar` | 雷达图 | x, y | 多维度评估 |
| `heatmap` | 热力图 | x, y | 矩阵数据 |
| `gauge` | 仪表盘 | y | 进度、KPI |
| `candlestick` | K线图 | x, y | 金融数据 |
| `boxplot` | 箱线图 | x, y | 统计分布 |
| `sankey` | 桑基图 | x, y | 流向分析 |
| `treemap` | 矩形树图 | x, y | 层次结构 |
| `wordcloud` | 词云 | x, y | 关键词频 |
| `liquid` | 水波图 | y | 进度填充 |
| `map` | 地图 | x, y | 地理分布 |
| `funnel` | 漏斗图 | x, y | 转化分析 |
| `sunburst` | 旭日图 | x, y | 多层环形 |
| `graph` | 关系图 | x, y | 网络拓扑 |
| `parallel` | 平行坐标 | x, y | 多维对比 |
| `combo` | 组合图 | series 表格 | 混合图表（多轴） |

## 选择指南

**根据数据类型选择：**
- **时间趋势** → `line` 或 `area`
- **类别对比** → `bar` 或 `pie`
- **相关性** → `scatter`
- **层次结构** → `treemap` 或 `sunburst`
- **地理数据** → `map`
- **流程转化** → `sankey` 或 `funnel`
- **多指标** → `radar` 或 `parallel`
- **混合展示** → `combo`（需要 series 表格）

## 示例

### Line
```cdl
Chart {
    use Data
    type line
    x month
    y sales
}
```

### Combo（双轴）
```cdl
Chart {
    use Data
    type combo
    
    ## series
    | field | as | type | axis |
    | --- | --- | --- | --- |
    | sales | 销售额 | bar | left |
    | profit | 利润 | line | right |
}
```

## 注意事项

- 某些图表类型需要特定的字段含义（如饼图的 `x` 是名称，`y` 是数值）
- `combo` 类型必须使用 `## series` 表格定义系列
- 地图需要额外注册地图数据
- 3D 图表（如 3D 柱状图）尚未支持

## 扩展新类型

如需添加新的图表类型，需要：
1. 在 `packages/renderer/src/renderer-v06.ts` 的 `switch` 中添加 `convert<Type>` 函数
2. 在 `PROMPT.md` 中记录该类型的使用方法
3. 在 `examples/<type>/` 添加至少 3 个示例