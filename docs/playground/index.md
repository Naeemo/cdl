# Playground

在线编辑 CDL，实时预览图表。

<script setup>
import Playground from './Playground.vue'
</script>

<Playground />

## 快速开始

1. 在左侧编辑器输入 CDL 代码
2. 点击「运行」按钮
3. 在右侧预览图表

## 支持的图表类型

- **line** - 折线图（支持平滑曲线）
- **bar** - 柱状图
- **pie** - 饼图（支持环形）
- **scatter** - 散点图
- **area** - 面积图
- **radar** - 雷达图

## 示例代码

```cdl
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
    @title "月度销售趋势"
}
```
