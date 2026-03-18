# 样式与外观

CDL 提供多种方式自定义图表外观，从简单的颜色调整到复杂的样式组合。

## 样式提示（@hints）

所有样式配置通过 `@` 开头的提示实现：

```cdl
Chart {
    use Data
    type line
    x month
    y amount
    
    @title "月度销售额"
    @color "#5470c6"
    @style "平滑曲线"
    @theme "dark"
    @grid true
}
```

## 标题与文本

### @title 和 @subtitle

```cdl
@title "2024 年销售趋势"
@subtitle "单位：万元，数据截至 12 月"
```

位置默认居中，可通过 `@layout` 调整。

### 字体与颜色

图表继承主题的字体设置。如需全局自定义：

```javascript
// 渲染器配置
import { configure } from '@cdl/renderer-echarts';
configure({
  textStyle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14
  }
});
```

## 颜色控制

### 全局颜色：@color

单色：
```cdl
@color "#5470c6"
```

渐变：
```cdl
@color "linear-gradient(#5470c6, #91cc75)"
```

字段映射（不同字段不同颜色）：
```cdl
@color "sales=蓝色,profit=红色,cost=灰色"
```

### 系列颜色（series 表格）

```cdl
## series
| field | color |
| --- | --- |
| sales | #5470c6 |
| profit | #ee6666 |
```

优先级：series.color > @color > 主题色

## 线条样式：@style

适用于线图、area 等：

- `"smooth"` - 平滑曲线（贝塞尔插值）
- `"dashed"` - 虚线
- `"dotted"` - 点线
- `"solid"` - 实线（默认）
- `"marker"` - 带数据点标记

示例：
```cdl
Chart {
    @style "平滑曲线，带数据点"
}
```

## 背景与网格：@grid

```cdl
@grid true   // 显示网格线
@grid false  // 隐藏网格
```

或精细控制：

```cdl
Chart {
    // 在 grid 配置块中
    grid:
      show: true
      backgroundColor: '#f5f5f5'
      borderColor: '#ddd'
}
```

## 主题：@theme

预设主题：
- `"light"` - 浅色（默认）
- `"dark"` - 深色
- `"auto"` - 跟随系统

```cdl
@theme "dark"
```

## 布局：@layout

调整图表元素布局：

- `"compact"` - 紧凑（缩小边距）
- `"comfortable"` - 宽松（加大边距）
- `"fullscreen"` - 全屏（隐藏非必要元素）

## 动画：@animation

控制渲染动画：

```cdl
@animation "easeOut 1000"
```

格式：`"<easing> <duration>"`

缓动函数：
- `linear`
- `easeIn`
- `easeOut`
- `easeInOut`
- `elastic`
- `bounce`

时长单位：毫秒（默认 1000）

## 组合样式

可以叠加多个样式提示：

```cdl
@title "季度销售"
@color "销售额=#5470c6,利润=#ee6666"
@style "平滑曲线"
@grid true
@theme "light"
```

## 样式优先级

从高到低：
1. **series 表格中的 color 列**
2. **@color 提示**
3. **主题 primary 色板**
4. **ECharts 默认**

## 自定义样式函数（高级）

如需完全控制，可直接操作 ECharts option：

```javascript
const { render } = require('@cdl/renderer-echarts');
const { file } = compile(cdlCode);
const { option } = render(file);

// 修改 option 后传给 ECharts
option.series[0].lineStyle = {
  width: 3,
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowBlur: 10
};
chart.setOption(option);
```

## 示例：完整样式配置

```cdl
@lang(data)
Sales {
    month,amount
    1月,100
    2月,150
    3月,200
}

Chart 销售趋势 {
    use Sales
    type line
    x month
    y amount
    
    @title "2024 月度销售趋势"
    @subtitle "数据来源：销售数据仓库"
    @color "#4fc3f7"
    @style "平滑曲线，带阴影"
    @grid true
    @theme "light"
    @animation "easeOut 800"
    @responsive true
}
```

## 注意事项

- 样式提示仅影响外观，不影响数据
- 某些图表类型不支持特定样式（如饼图的 `style: smooth` 无效）
- 主题与样式叠加时，后者优先
- 大量自定义样式可能增加渲染开销

## 调试样式

查看生成的 ECharts option：

```javascript
console.log(JSON.stringify(option, null, 2));
```

对比预期，调整提示直到满意。

## 未来计划

- 样式预设库（"商务"、"清新"、"科技"等）
- CSS-in-CDL 支持（类名映射）
- 样式继承（子图表继承父级样式）
- 动态样式（根据数据动态调整颜色）