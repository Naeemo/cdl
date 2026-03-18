# 主题系统

CDL 支持多种主题，可以快速切换图表的整体风格。

## 内置主题

### light（默认）
- 背景：白色 `#ffffff`
- 文字：深灰色 `#333333`
- 主色：蓝色系 `['#5470c6', '#91cc75', '#fac858', ...]`

### dark
- 背景：深蓝黑 `#1a1a2e`
- 文字：浅灰 `#e0e0e0`
- 主色：亮色系 `['#4992ff', '#7cffb2', '#fddd60', ...]`

### auto
- 自动检测系统主题（实验性）

## 使用主题

### 全局主题

渲染时指定主题名称：

```javascript
import { render } from '@cdl/renderer-echarts';

const option = render(cdlFile, 'dark'); // 第二个参数
```

### 图表级主题

在 CDL 代码中使用 `@theme` 提示：

```cdl
Chart 暗色主题 {
    use Data
    type line
    x month
    y amount
    @theme "dark"
}
```

或

```cdl
Chart {
    use Data
    type bar
    x category
    y value
    @theme "auto"  // 跟随系统
}
```

## 自定义主题

主题定义为颜色调色板对象：

```javascript
import { THEMES } from '@cdl/renderer-echarts';

// 添加自定义主题
THEMES.myTheme = {
  primary: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
  background: '#f8f9fa',
  text: '#2d3436'
};

// 使用
render(cdlFile, 'myTheme');
```

## 主题最佳实践

1. **一致风格**：同一应用中统一使用 1-2 个主题
2. **对比度**：确保文字与背景的对比度足够（WCAG AA 标准）
3. **色盲友好**：避免仅靠颜色区分，添加标签或图案
4. **打印考虑**：深色主题在打印时可能不清晰，提供浅色备选
5. **品牌色**：自定义主题可以融入品牌主色

## 主题与响应式

主题与响应式独立工作，可以同时使用：

```cdl
Chart {
    use Data
    type line
    x month
    y amount
    @theme "dark"
    @responsive true
}
```

## 未来计划

- 主题编辑器 UI
- 导入导出主题配置
- 主题切换动画
- 多级主题继承（全局→图表→系列）