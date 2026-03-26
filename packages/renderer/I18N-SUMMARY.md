# CDL i18n 实现总结

## 概述

为 CDL (Chart Definition Language) 渲染器添加了完整的国际化（i18n）支持，包括图表标签、提示框、图例等多语言功能。

## 实现内容

### 1. 核心 i18n 模块 (`src/i18n/`)

#### `index.ts` - i18n 核心功能
- `t(key, defaultValue, params)` - 翻译函数，支持字符串插值
- `setLocale(locale)` / `getLocale()` - 语言设置/获取
- `configureI18n(config)` - 配置 i18n（含自定义翻译）
- `formatNumber()` / `formatDate()` - 本地化数字/日期格式化
- `BuiltInKeys` - 内置翻译键常量

#### `chart-i18n.ts` - 图表专用 i18n 辅助函数
- `getChartTypeName()` - 获取图表类型的本地化名称
- `translateAxisName()` - 翻译坐标轴名称
- `translateSeriesName()` - 翻译系列名称
- `translateLegendNames()` - 翻译图例名称数组
- `translateTitle()` - 翻译标题
- `createTooltipFormatter()` - 创建多语言提示框格式化器
- `createPieTooltipFormatter()` - 创建饼图专用提示框格式化器
- `createGaugeFormatter()` - 创建仪表盘数据格式化器
- `translateAggregation()` - 翻译聚合函数名称
- `applyI18nToOption()` - 应用 i18n 到 ECharts 配置

#### `locale-loader.ts` - 语言包加载器
- 自动加载并注册 10 种语言包
- `detectBrowserLocale()` - 自动检测浏览器语言
- `getSupportedLocales()` - 获取支持的语言列表

### 2. 语言包 (`src/i18n/locales/`)

支持 10 种语言：

| 语言文件 | 语言 | 覆盖率 |
|---------|------|--------|
| `zh-CN.ts` | 简体中文 | 100% |
| `en-US.ts` | English | 100% |
| `ja-JP.ts` | 日本語 | 100% |
| `ko-KR.ts` | 한국어 | 100% |
| `de-DE.ts` | Deutsch | 100% |
| `fr-FR.ts` | Français | 100% |
| `es-ES.ts` | Español | 100% |
| `ru-RU.ts` | Русский | 100% |
| `pt-BR.ts` | Português | 100% |
| `it-IT.ts` | Italiano | 100% |

### 3. 渲染器集成 (`renderer-v06.ts`)

#### 新增接口
```typescript
export interface RenderOptions {
  theme?: string;
  locale?: Locale;
  i18n?: boolean;  // 是否启用国际化（默认 true）
}
```

#### 新增 API
- `setRenderLocale(locale)` - 设置全局渲染语言
- `getRenderLocale()` - 获取当前渲染语言

#### 向后兼容
```typescript
// 旧用法仍然支持
render(cdlFile, 'dark');  // 第二个参数可以是主题字符串

// 新用法
render(cdlFile, { theme: 'dark', locale: 'en-US' });
```

#### 自动 i18n 处理
- 从 `@locale` hint 自动检测语言设置
- 自动翻译标题、轴标签、系列名、图例
- 自动设置多语言提示框格式化器

### 4. CDL 类型更新 (`compiler/src/types.ts`)

在 `ChartHint` 接口中添加：
```typescript
locale?: string;  // @locale "..." - i18n语言设置
```

### 5. 导出更新 (`index.ts`)

重新导出所有 i18n 功能：
```typescript
export {
  // 核心 i18n
  t, setLocale, getLocale, configureI18n,
  formatNumber, formatDate, Locale, BuiltInKeys,
  
  // 图表 i18n
  ChartI18n, getChartTypeName, translateAxisName,
  translateSeriesName, translateLegendNames,
  translateTitle, createTooltipFormatter,
  createPieTooltipFormatter, createGaugeFormatter,
  translateAggregation, applyI18nToOption,
  
  // 语言包
  initLocales, detectBrowserLocale, getSupportedLocales,
};
```

## 使用示例

### CDL 语法
```cdl
Chart 销售数据 {
    @locale "en-US"
    @title "Sales Overview"
    
    use SalesData
    type bar
    x month
    y amount
}
```

### JavaScript/TypeScript
```typescript
import { render, setRenderLocale } from '@naeemo/cdl-renderer-echarts';

// 全局设置语言
setRenderLocale('en-US');
const result = render(cdlFile);

// 单次渲染设置语言
const result = render(cdlFile, {
  theme: 'dark',
  locale: 'ja-JP'
});

// 自动检测浏览器语言
import { detectBrowserLocale } from '@naeemo/cdl-renderer-echarts';
setRenderLocale(detectBrowserLocale());
```

## 翻译键参考

### 图表类型
- `chart.line`, `chart.bar`, `chart.pie`, ...

### 通用标签
- `label.total`, `label.average`, `label.count`, ...

### 坐标轴
- `axis.x`, `axis.y`, `axis.category`, ...

### 数据相关
- `data.empty`, `data.loading`, `data.error`

### 时间
- `time.year`, `time.month`, `time.day`, ...

### 聚合
- `agg.sum`, `agg.avg`, `agg.count`, ...

## 测试

运行 i18n 测试：
```bash
cd packages/renderer
node test-i18n.mjs
```

测试结果：
- ✅ 10 种语言全部支持
- ✅ 翻译键值正确
- ✅ 数字格式化符合各国习惯
- ✅ 提示框格式化器正常工作
- ✅ ECharts 配置自动翻译

## 文档

- `I18N.md` - i18n 功能完整文档
- `I18N-EXAMPLES.md` - 使用示例

## 向后兼容性

- 所有现有代码无需修改即可工作
- 默认语言为简体中文（与原行为一致）
- 新增功能均为可选
