# 部署与集成

本文档介绍如何将 CDL 集成到不同环境中。

## Web 应用

### 使用 CDN（快速开始）

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <!-- 暂未提供 CDN 包，建议 npm 安装 -->
</head>
<body>
  <div id="chart" style="width: 800px; height: 600px;"></div>
  
  <script type="module">
    import { compile } from '@cdl/compiler';
    import { render } from '@cdl/renderer-echarts';
    
    const cdl = `...`; // 你的 CDL 代码
    const { file } = compile(cdl);
    const { option } = render(file);
    
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption(option);
  </script>
</body>
</html>
```

### React 应用

```bash
npm install @cdl/react @cdl/compiler @cdl/renderer-echarts
```

```tsx
import { CDLChart } from '@cdl/react';

function Dashboard() {
  return (
    <div>
      <CDLChart
        code={cdlString}
        theme="light"
        width="100%"
        height={400}
        onSuccess={() => console.log('rendered')}
        onError={(err) => console.error(err)}
      />
    </div>
  );
}
```

### Vue 应用

```bash
npm install @cdl/compiler @cdl/renderer-echarts echarts
```

```vue
<template>
  <div ref="chart" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';
import * as echarts from 'echarts';

const props = defineProps(['code']);
const chartRef = ref(null);
let chart = null;

onMounted(() => {
  const { file } = compile(props.code);
  const { option } = render(file);
  chart = echarts.init(chartRef.value);
  chart.setOption(option);
  
  window.addEventListener('resize', () => chart.resize());
});

watch(() => props.code, (newCode) => {
  const { file } = compile(newCode);
  const { option } = render(file);
  chart.setOption(option);
});
</script>
```

## Node.js 服务端渲染

使用 Puppeteer 生成图片：

```javascript
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';
import puppeteer from 'puppeteer';

async function renderToImage(cdlCode, outputPath) {
  const { file } = compile(cdlCode);
  const { option } = render(file);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(`
    <div style="width:800px;height:600px;"></div>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    <script>
      const chart = echarts.init(document.querySelector('div'));
      chart.setOption(${JSON.stringify(option)});
    </script>
  `);
  
  await page.screenshot({ path: outputPath, fullPage: false });
  await browser.close();
}
```

## API 服务

### REST API 渲染服务

```javascript
import express from 'express';
import { compile } from '@cdl/compiler';
import { render } from '@cdl/renderer-echarts';

const app = express();
app.use(express.json());

app.post('/api/render', (req, res) => {
  const { cdl, format = 'json' } = req.body;
  
  try {
    const { file } = compile(cdl);
    const { option } = render(file);
    
    if (format === 'png') {
      // 使用 Puppeteer 或 headless Chrome 生成图片
      // ...
    } else {
      res.json({ success: true, option });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.listen(3000);
```

### GraphQL Resolver

```graphql
type Query {
  renderCDL(cdl: String!): JSON
}
```

```javascript
const resolvers = {
  Query: {
    renderCDL: (_, { cdl }) => {
      const { file } = compile(cdl);
      const { option, success } = render(file);
      return option;
    }
  }
};
```

## AI Agent 集成

### MCP 服务器

CDL 提供 MCP (Model Context Protocol) 服务器，可直接被 Claude Desktop、Cursor 等 AI IDE 使用。

```bash
node packages/mcp-server/dist/server.js
```

配置 Claude Desktop：

```json
{
  "mcpServers": {
    "cdl": {
      "command": "node",
      "args": ["/path/to/cdl/packages/mcp-server/dist/server.js"]
    }
  }
}
```

功能：
- `cdl_compile` - 编译 CDL
- `cdl_render` - 生成图表配置
- `cdl_examples` - 获取示例
- `cdl_validate` - 语法检查

## 移动端

React Native 集成（需要 `echarts-for-react-native`）：

```bash
npm install @cdl/compiler @cdl/renderer-echarts echarts-for-react-native
```

```tsx
import { CDLChart } from '@cdl/react';
import { createRoot } from 'react-native/client';

// 用法与 Web 类似，但需确保 echarts-for-react-native 正常渲染
```

## 数据源安全

### 服务端代理

不要在客户端暴露数据库凭证。使用服务端代理：

```javascript
// 客户端：使用 @lang(rest) 调用你的 API
@lang(rest)
@url('/api/chart-data')
Data { ... }

// 服务端：/api/chart-data 实际查询数据库
app.get('/api/chart-data', async (req, res) => {
  const data = await db.query('SELECT ...');
  res.json({ headers: [...], rows: [...] });
});
```

### 缓存策略

```cdl
@lang(sql)
@source('sales')
@cache(300)  // 缓存 5 分钟
@timeout(30)
Data { ... }
```

## 性能优化

- **代码分割**：只打包使用的包
- **懒加载**：图表进入可视区域再渲染
- **服务端渲染**：预渲染静态图表
- **CDN 缓存**：静态资源长期缓存

## 监控

记录指标：
- 编译成功率
- 渲染耗时
- 图表数量
- 错误类型分布

## 常见集成问题

| 问题 | 解决 |
|------|------|
| Module not found | 检查 `@cdl/*` 包是否安装 |
| ECharts undefined | 确保 `echarts` 已安装并 import |
| CORS 错误 | 数据源使用同域 API 或配置 CORS |
| 样式不生效 | 检查容器尺寸，确保有 width/height |

## 生产建议

1. **锁定版本**：`package.json` 指定 CDL 版本
2. **错误边界**：捕获渲染失败并降级显示
3. **加载状态**：大数据图表显示 loading
4. **降级方案**：失败时显示数据表格
5. **性能监控**：使用 Web Vitals 跟踪

## 下一步

- [开发者指南](./developer.md) - 参与 CDL 开发
- [API 参考](./api.md) - 详细 API 文档
- [故障排除](./troubleshooting.md) - 解决问题