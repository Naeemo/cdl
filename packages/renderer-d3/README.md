# @cdl/renderer-d3

D3.js renderer for CDL - Convert CDL AST to D3.js rendering specifications.

## Installation

```bash
npm install @cdl/renderer-d3
```

## Usage

```typescript
import { render } from '@cdl/renderer-d3';
import type { CDLFile } from '@cdl/renderer-d3';

const cdlFile: CDLFile = {
  data: [{
    type: 'data',
    name: 'sales',
    lang: 'data',
    config: {},
    query: 'month,revenue\nJan,100\nFeb,150\nMar,200',
  }],
  charts: [{
    type: 'chart',
    chartType: 'line',
    dataSources: ['sales'],
    x: 'month',
    y: 'revenue',
    hints: { title: 'Monthly Revenue' },
  }],
};

const result = render(cdlFile, 'default');
if (result.success) {
  console.log(result.spec);
  // Use the D3 spec to render with D3.js
}
```

## Supported Chart Types

- **line** - Line charts with optional smoothing
- **bar** - Bar/column charts
- **pie** - Pie charts (including donut charts)
- **scatter** - Scatter plots
- **area** - Area charts
- **radar** - Radar/spider charts
- **combo** - Mixed chart types
- **heatmap** - Heatmap charts

## D3 Spec Output

The renderer outputs a D3 specification object containing:

```typescript
interface D3Spec {
  type: ChartType;
  width: number;
  height: number;
  margin: { top, right, bottom, left };
  title?: { text, fontSize, fontWeight, color };
  scales: Record<string, D3Scale>;
  axes: D3Axis[];
  series: D3Series[];
  data: Record<string, unknown>[];
  animation?: D3Animation;
  colorScheme?: string[];
  legend?: { position, orientation };
  tooltip?: { enabled, format };
}
```

## Themes

Built-in color themes:

- `default` - Tableau 10 color palette
- `category10` - D3 Category 10
- `category20` - D3 Category 20
- `tableau` - Tableau color palette
- `dark` - Optimized for dark backgrounds

## License

MIT
