# CDL i18n 示例

## 基本用法

### 在 CDL 中设置语言

```cdl
// 使用英文标签
Chart Sales Overview {
    @locale "en-US"
    @title "Monthly Sales"
    
    use SalesData
    type bar
    x month
    y amount
}

// 使用中文标签
Chart 销售概览 {
    @locale "zh-CN"
    @title "月度销售"
    
    use SalesData
    type bar
    x 月份
    y 金额
}

// 使用日文标签
Chart 売上概要 {
    @locale "ja-JP"
    @title "月次売上"
    
    use SalesData
    type bar
    x 月
    y 売上
}
```

## 支持的 locale

| locale | 语言 | 示例 |
|--------|------|------|
| zh-CN | 简体中文 | 折线图、柱状图、总计 |
| en-US | English | Line Chart, Bar Chart, Total |
| ja-JP | 日本語 | 折れ線グラフ、棒グラフ、合計 |
| ko-KR | 한국어 | 선형 차트、막대 차트、합계 |
| de-DE | Deutsch | Liniendiagramm、Balkendiagramm、Gesamt |
| fr-FR | Français | Graphique linéaire、Graphique à barres、Total |
| es-ES | Español | Gráfico de líneas、Gráfico de barras、Total |
| ru-RU | Русский | Линейный график、Столбчатая диаграмма、Итого |
| pt-BR | Português | Gráfico de linha、Gráfico de barras、Total |
| it-IT | Italiano | Grafico a linee、Grafico a barre、Totale |

## 编程接口

### 设置语言

```typescript
import { render, setRenderLocale } from '@naeemo/cdl-renderer-echarts';

// 全局设置语言
setRenderLocale('en-US');
const result1 = render(cdlFile);

// 单次渲染设置语言
const result2 = render(cdlFile, {
  theme: 'dark',
  locale: 'ja-JP'
});
```

### 自动检测浏览器语言

```typescript
import { render, detectBrowserLocale, setRenderLocale } from '@naeemo/cdl-renderer-echarts';

// 自动检测并使用浏览器语言
setRenderLocale(detectBrowserLocale());
```

### 自定义翻译

```typescript
import { configureI18n, t } from '@naeemo/cdl-renderer-echarts';

// 添加自定义翻译
configureI18n({
  locale: 'zh-CN',
  translations: {
    'custom.companyName': '我的公司',
    'custom.revenue': '营收'
  }
});

// 使用自定义翻译
const text = t('custom.companyName');  // '我的公司'
```

## 提示框国际化

提示框会自动根据语言显示相应的格式：

```typescript
import { render } from '@naeemo/cdl-renderer-echarts';

setRenderLocale('zh-CN');
const option = render(cdlFile).option;

// 提示框将显示中文格式：
// 系列名: 数值
```

## 数值格式化

数值会根据当前语言自动格式化：

```typescript
import { formatNumber } from '@naeemo/cdl-renderer-echarts';

setRenderLocale('en-US');
formatNumber(1234567.89);  // "1,234,567.89"

setRenderLocale('de-DE');
formatNumber(1234567.89);  // "1.234.567,89"

setRenderLocale('zh-CN');
formatNumber(1234567.89);  // "1,234,567.89"
```

## 图表类型名称

获取图表类型的本地化名称：

```typescript
import { getChartTypeName } from '@naeemo/cdl-renderer-echarts';

setRenderLocale('zh-CN');
getChartTypeName('funnel');  // '漏斗图'

setRenderLocale('en-US');
getChartTypeName('funnel');  // 'Funnel Chart'

setRenderLocale('ja-JP');
getChartTypeName('funnel');  // 'ファネル図'
```

## 完整示例

```typescript
import { 
  render, 
  setRenderLocale, 
  getSupportedLocales,
  formatNumber 
} from '@naeemo/cdl-renderer-echarts';

// 显示支持的语言
const locales = getSupportedLocales();
locales.forEach(loc => {
  console.log(`${loc.code}: ${loc.nativeName}`);
});

// 渲染不同语言的图表
const cdlFile = {
  charts: [{
    name: 'Sales Chart',
    chartType: 'bar',
    dataSources: ['SalesData'],
    x: 'month',
    y: 'amount',
    hints: { title: 'Sales Overview' }
  }],
  data: [{
    name: 'SalesData',
    type: 'data',
    lang: 'data',
    config: {},
    query: 'month,amount\nJan,1000\nFeb,1500\nMar,2000'
  }]
};

// 英文版本
setRenderLocale('en-US');
const enOption = render(cdlFile).option;

// 中文版本
setRenderLocale('zh-CN');
const zhOption = render(cdlFile).option;

// 日文版本
setRenderLocale('ja-JP');
const jaOption = render(cdlFile).option;
```
