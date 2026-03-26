# CDL 无障碍支持 (Accessibility)

CDL 组件库现已全面支持无障碍访问，确保所有用户（包括使用屏幕阅读器和键盘导航的用户）都能有效使用图表功能。

## 🎯 无障碍特性

### 1. ARIA 标签

所有图表组件都包含适当的 ARIA 属性：

- **`role="img"`** - 图表容器被标识为图片，便于屏幕阅读器识别
- **`role="region"`** - 组件整体被标识为可导航区域
- **`aria-label`** - 提供图表的文字描述
- **`aria-description`** - 支持详细的数据描述
- **`aria-live`** - 状态变化时自动通知屏幕阅读器

### 2. 键盘导航

完整的键盘操作支持：

| 快捷键 | 功能 |
|--------|------|
| `Tab` | 在图表元素和控件之间导航 |
| `Enter` | 激活按钮或进入下钻层级 |
| `Escape` | 关闭详情面板/模态框/导出菜单 |
| `Ctrl/Cmd + Enter` | 刷新图表（Playground） |
| `Home` | 返回面包屑首页 |

### 3. 屏幕阅读器优化

- **实时播报**：图表加载、错误、状态变化自动播报
- **数据描述**：支持通过 `ariaDescription` 属性提供详细数据说明
- **焦点管理**：自动管理焦点，确保导航流畅
- **跳过链接**：Playground 提供"跳转到预览区"的快捷导航

## 📦 组件使用

### React 组件

```tsx
import { CDLChart } from '@naeemo/cdl-react';

function App() {
  return (
    <CDLChart
      code={cdlCode}
      theme="light"
      // 无障碍属性
      ariaLabel="月度销售数据图表"
      ariaDescription="展示2024年第一季度各月销售额和利润的对比数据。销售额在1月为120万，2月为150万，3月为180万。利润分别为15万、18万和22万。"
      decorative={false}
      // 下钻功能
      enableDrillDown
      onDrillDown={handleDrillDown}
    />
  );
}
```

### Vue 组件

```vue
<template>
  <CDLChart
    :code="cdlCode"
    theme="light"
    aria-label="月度销售数据图表"
    aria-description="展示2024年第一季度各月销售额和利润的对比数据"
    :decorative="false"
  />
</template>

<script setup>
import { CDLChart } from '@naeemo/cdl-vue';
</script>
```

## 🔧 API 参考

### 无障碍 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ariaLabel` | `string` | `'数据图表'` | 图表的简短描述 |
| `ariaDescription` | `string` | - | 图表的详细描述，用于屏幕阅读器 |
| `decorative` | `boolean` | `false` | 如果为 `true`，图表将被标记为装饰性（`aria-hidden`） |

### 最佳实践

1. **始终提供有意义的 `ariaLabel`**
   ```tsx
   // ✅ 好的示例
   ariaLabel="2024年第一季度销售额趋势图"
   
   // ❌ 避免
   ariaLabel="图表"
   ```

2. **为复杂图表提供详细描述**
   ```tsx
   ariaDescription="柱状图显示各部门季度业绩。销售部门120万（最高），市场部门85万，技术部门95万。"
   ```

3. **装饰性图表标记**
   ```tsx
   // 如果图表仅用于视觉装饰，没有数据意义
   decorative={true}
   ```

## ♿ 可访问性测试

### 屏幕阅读器测试

使用以下工具测试：

- **NVDA** (Windows) - 免费开源
- **JAWS** (Windows) - 商业软件
- **VoiceOver** (macOS/iOS) - 系统内置
- **TalkBack** (Android) - 系统内置

测试清单：
- [ ] 图表加载时听到"图表加载完成"
- [ ] 按 Tab 键可以导航到图表
- [ ] 能听到图表的 aria-label 描述
- [ ] 下钻时听到层级变化通知
- [ ] 错误时听到错误信息

### 键盘导航测试

1. 禁用鼠标，仅使用键盘操作
2. 按 Tab 键遍历所有可交互元素
3. 使用 Enter 激活按钮
4. 使用 Escape 关闭面板

### 自动化测试

使用 axe-core 进行自动化无障碍检测：

```bash
npm install --save-dev @axe-core/react
```

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import axe from '@axe-core/react';

axe(React, ReactDOM, 1000);
```

## 🎨 辅助功能支持

### 减少动画

组件尊重用户的 `prefers-reduced-motion` 设置：

```css
@media (prefers-reduced-motion: reduce) {
  /* 动画被禁用 */
}
```

### 高对比度

支持 Windows 高对比度模式：

```css
@media (prefers-contrast: high) {
  /* 增强对比度 */
}
```

### 暗色模式

自动适应系统暗色模式偏好：

```css
@media (prefers-color-scheme: dark) {
  /* 暗色样式 */
}
```

## 🐛 常见问题

### Q: 图表被屏幕阅读器跳过？

确保没有设置 `decorative={true}`，并且图表有明确的 `ariaLabel`。

### Q: 键盘无法导航到图表？

检查是否有其他元素占用了 Tab 顺序。确保图表容器有 `tabindex="0"`。

### Q: 下钻功能没有播报？

确认 `enableDrillDown` 已启用，并且使用了支持无障碍的 CDLChart 组件版本。

## 📚 相关资源

- [WAI-ARIA 规范](https://www.w3.org/WAI/ARIA/)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [无障碍图表指南](https://www.w3.org/WAI/tutorials/images/complex/)

## 🤝 贡献

发现无障碍问题？请提交 Issue 或 PR，帮助改进 CDL 的无障碍支持。
