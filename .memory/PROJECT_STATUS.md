# CDL 项目状态

## 当前状态

### 已完成 ✅

#### 1. 语法规范 v0.1
- 文件: `.memory/SYNTAX_SPEC.md`
- 核心: 分层混合模式（结构化核心 + @提示层）
- 支持: @lang(sql|dax|data), @source, @style, @color 等

#### 2. 编译器 v0.2
- 文件: `packages/compiler/compiler.ts`
- 类型: `packages/compiler/types.ts`
- 功能:
  - ✅ 注释剥离（// 和 /* */）
  - ✅ 数据源解析（SQL/DAX/裸数据）
  - ✅ 图表定义解析
  - ✅ @提示层解析
  - ✅ 输出带类型的 JSON AST

#### 3. 示例片段
- 数量: **54 个**
- 覆盖: SQL(20), DAX(12), 裸数据(22)
- 图表: line, bar, pie, scatter, area, combo, radar, heatmap, gauge 等

### 编译器输出示例

```bash
$ npx ts-node compiler.ts examples/sql/line/01_monthly_sales.cdl
```

输出:
```json
{
  "data": [{
    "type": "data",
    "name": "MonthlySales",
    "lang": "sql",
    "config": { "source": "sales_db" },
    "query": "SELECT ..."
  }],
  "charts": [{
    "type": "chart",
    "chartType": "line",
    "dataSources": ["MonthlySales"],
    "x": "month",
    "y": "sales",
    "hints": {
      "style": "平滑曲线，带数据点标记",
      "color": "#4fc3f7"
    }
  }]
}
```

### 类型定义概览

```typescript
// 数据源
interface DataDefinition {
  type: 'data';
  name: string;
  lang: 'sql' | 'dax' | 'data';
  config: { source?, timeout?, cache? };
  query: string;
}

// 图表
interface ChartDefinition {
  type: 'chart';
  chartType: ChartType;
  dataSources: string[];
  x?: string;
  y?: string;
  group?: string;
  stack?: string | boolean;
  hints: { style?, color?, animation?, title? };
}

// 编译结果
interface CompileResult {
  success: boolean;
  result?: CDLFile;
  errors: CompileError[];
}
```

---

## 待完成

### Phase 3: 代码生成
- [ ] CDL → ECharts 配置生成器
- [ ] CDL → D3 配置生成器
- [ ] 服务端渲染支持

### Phase 4: AI 集成
- [ ] 自然语言 → CDL 转换
- [ ] CDL 解释器/文档生成

### Phase 5: 生态工具
- [ ] VS Code 插件
- [ ] 在线编辑器
- [ ] 预览工具

---

## 最后更新
2026-03-11
