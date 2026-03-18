# 交互配置指南

CDL 支持丰富的交互功能，包括 tooltip、zoom、brush、drill-down、link 等。

## 配置方式

### 方式 1：@interaction 提示

```cdl
Chart {
    use Data
    type line
    x month
    y amount
    @interaction "tooltip:shared zoom:inside"
}
```

### 方式 2：## interaction 块

```cdl
Chart {
    use Data
    type line
    x month
    y amount
    
    ## interaction
    tooltip: shared
    zoom: inside
    brush: true
}
```

## 交互选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `tooltip` | `single` \| `shared` \| `none` | 提示框触发方式 |
| `legend` | `boolean` | 显示图例 |
| `zoom` | `boolean` \| `inside` \| `slider` \| `{type, ...}` | 缩放 |
| `brush` | `boolean` \| `{connect, link}` | 刷选 |
| `drillDown` | `boolean` \| `{field, maxLevels}` | 下钻 |
| `link` | `string[]` \| `{charts, group, highlight}` | 联动 |
| `live` | `boolean` \| `number` \| `stream` | 实时更新 |
| `animation` | `{easing, duration, delay, loop}` | 动画 |

## 详细说明

### Tooltip

- `single`: 单个系列触发（默认）
- `shared`: 所有系列显示相同提示
- `none`: 禁用

### Zoom

- `true` 或 `inside`: 鼠标滚轮缩放
- `slider`: 显示底部滑动条
- `{type: 'inside', start: 0, end: 100}`: 自定义参数

### Brush

- `true`: 启用刷选
- `{connect: ['chart1', 'chart2']}`: 跨图表联动
- `{link: {charts: ['other'], group: 'category'}}`: 联动配置

### Drill-down

- `true`: 使用默认字段（group 或分类字段）
- `{field: 'region'}`: 指定下钻字段
- `{maxLevels: 3}`: 限制最大层级
- `{breadcrumb: true}`: 显示面包屑导航

### Live Updates

- `true`: 自动刷新（默认 5s）
- `number`: 刷新间隔（毫秒）
- `'stream'`: WebSocket 实时流

### Animation

```cdl
@interaction "animation:easeOut duration:800"
```

或

```cdl
## interaction
animation:
  easing: easeOut
  duration: 800
  delay: 100
  loop: false
```

## 示例：全功能交互

```cdl
Chart 交互示例 {
    use SalesData
    type line
    x month
    y amount
    group product
    
    ## interaction
    tooltip: shared
    zoom: inside
    brush: true
    drillDown:
      field: region
      maxLevels: 3
      breadcrumb: true
    link:
      charts: [其他图表ID]
      group: product
      highlight: both
    animation:
      easing: easeOut
      duration: 1000
}
```

## 注意事项

- 交互功能依赖渲染器支持，ECharts 渲染器已完全支持
- `link` 和 `brush` 需要多个图表联动，需确保图表有唯一 ID
- `drillDown` 需要数据支持层级结构
- 实时更新 `live` 需要后端提供数据推送接口