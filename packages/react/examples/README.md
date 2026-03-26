# CDL React 联动高亮示例

本目录包含 CDL React 组件的联动高亮功能示例。

## 文件说明

- `LinkageExample.tsx` - 完整的联动功能示例，包含多种使用场景

## 使用方式

### 1. 基础联动

```tsx
import { CDLChart, ChartLinkageProvider, LinkageConfig } from '@naeemo/cdl-react';

// 配置联动
const linkage: LinkageConfig = {
  groupId: 'my-dashboard',
  linkField: 'category',
  enableHover: true,
};

// 使用 Provider 包裹需要联动的图表
function App() {
  return (
    <ChartLinkageProvider>
      <CDLChart code={chart1Code} linkage={linkage} />
      <CDLChart code={chart2Code} linkage={linkage} />
    </ChartLinkageProvider>
  );
}
```

### 2. LinkageConfig 配置项

| 属性 | 类型 | 说明 |
|------|------|------|
| `groupId` | string | 联动组ID，相同ID的图表互相联动 |
| `linkField` | string | 关联字段，如 'category', 'date' |
| `enableHover` | boolean | 是否启用悬停联动（默认true） |
| `enableClick` | boolean | 是否启用点击联动（默认false） |
| `highlightStyle` | object | 高亮元素样式 |
| `unhighlightStyle` | object | 非高亮元素样式 |

### 3. 多组联动

不同 `groupId` 的图表组互不干扰：

```tsx
<ChartLinkageProvider>
  {/* 组 A */}
  <CDLChart linkage={{ groupId: 'group-a', linkField: 'category' }} />
  <CDLChart linkage={{ groupId: 'group-a', linkField: 'category' }} />
  
  {/* 组 B */}
  <CDLChart linkage={{ groupId: 'group-b', linkField: 'region' }} />
  <CDLChart linkage={{ groupId: 'group-b', linkField: 'region' }} />
</ChartLinkageProvider>
```

### 4. 手动控制

使用 Hook 手动控制高亮：

```tsx
import { useChartLinkage } from '@naeemo/cdl-react';

function MyComponent() {
  const { highlight, clear } = useChartLinkage({
    groupId: 'my-group',
    linkField: 'category',
  });

  return (
    <>
      <button onClick={() => highlight('电子产品')}>高亮电子</button>
      <button onClick={clear}>清除</button>
    </>
  );
}
```

## 运行示例

```bash
# 进入 react 包目录
cd packages/react

# 安装依赖
npm install

# 运行示例
npm run example
```
