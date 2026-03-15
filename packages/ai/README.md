# @cdl/ai

AI-Powered Natural Language to CDL Code Generator

将自然语言描述转换为 CDL (Chart Definition Language) 代码。

## 安装

```bash
npm install @cdl/ai
```

## 使用

### 基础用法

```typescript
import { nlToCDL } from '@cdl/ai';

const result = await nlToCDL("最近6个月销售额折线图，蓝色", {
  apiKey: 'your-kimi-api-key',
  model: 'kimi-k2p5',
});

if (result.success) {
  console.log(result.cdl);
  // 输出:
  // @lang(data)
  // Data 销售数据 { ... }
  // Chart 销售趋势 { ... }
}
```

### CLI 用法

```bash
# 设置 API Key
export KIMI_API_KEY="your-api-key"

# 生成 CDL
cdl nl "画一个饼图展示各部门预算占比"

# 保存到文件
cdl nl "蓝色折线图，显示月度销售趋势" --output chart.cdl
```

### 批量转换

```typescript
import { nlToCDLBatch } from '@cdl/ai';

const descriptions = [
  "销售额折线图",
  "各部门预算饼图",
  "用户增长柱状图"
];

const results = await nlToCDLBatch(descriptions, { apiKey });
```

## API

### `nlToCDL(description, options)`

将自然语言描述转换为 CDL 代码。

**参数:**
- `description: string` - 自然语言描述
- `options: NLToCDLOptions`
  - `apiKey: string` - API Key (必填)
  - `model?: string` - 模型名称，默认 'kimi-k2p5'
  - `baseURL?: string` - API 基础 URL
  - `temperature?: number` - 温度参数，默认 0.3

**返回:** `Promise<NLToCDLResult>`
- `success: boolean` - 是否成功
- `cdl?: string` - 生成的 CDL 代码
- `ast?: object` - AST 结构
- `error?: string` - 错误信息

## 环境变量

- `KIMI_API_KEY` - Kimi API Key
- `OPENAI_API_KEY` - OpenAI API Key (备选)

## License

MIT