# CDL 开发计划：更多图表类型 + 交互增强

## 🎯 目标
扩展 CDL 的图表类型和交互能力，使其能表达更丰富的数据可视化需求。

---

## 📊 新图表类型（基于 ECharts）

### 1. Funnel（漏斗图）
**用途**：转化分析、流程流失
**数据格式**：
- x: 阶段名称（如"浏览→点击→购买"）
- y: 数值（各阶段数量）
**示例**：
```cdl
Chart 转化漏斗 {
    use FunnelData
    type funnel
    x stage
    y count
}
```

### 2. Treemap（树图）
**用途**：层次数据、类别占比
**数据格式**：
- 需要层级结构：父类→子类→值
- 或使用 `group` 字段表示层级
**示例**：
```cdl
Chart 销售树图 {
    use SalesData
    type treemap
    x category  // 父级
    y subcategory  // 子级
    group value  // 数值
}
```

### 3. Sunburst（旭日图）
**用途**：多层环形图、层级占比
**数据格式**：
- 多层级数据（通过 `group` 或嵌套结构）
**示例**：
```cdl
Chart 组织架构 {
    use OrgData
    type sunburst
    x level1  // 一级分类
    y level2  // 二级分类
    group level3  // 三级分类
}
```

### 4. Sankey（桑基图）
**用途**：流程流向、能量/物质转移
**数据格式**：
- source: 源节点
- target: 目标节点
- value: 流量数值
**示例**：
```cdl
Chart 用户路径 {
    use SankeyData
    type sankey
    x source
    y target
    group value
}
```

---

## 🖱️ 交互增强

### 5. 数据下钻（Drill-down）
**语法**：
```cdl
Chart {
    ...
    @interaction "drill-down:true"
}
```
或高级配置：
```cdl
Chart {
    ...
    @interaction "drill-down:field=category,levels=2"
}
```

**行为**：
- 点击图表元素（柱、扇区等）下钻到下一层数据
- 支持 breadcrumb 返回上一级
- 可配置下钻层级和字段映射

### 6. 联动高亮（Linked Highlight）
**语法**：
```cdl
@interaction "link:chart2,chart3"
```
**行为**：
- 在一个图表中选中元素，其他图表高亮对应数据
- 支持 group 字段自动关联

### 7. 动态数据更新（实时刷新）
**语法**：
```cdl
@interaction "live:5000"  // 每5秒刷新
```
或：
```cdl
@interaction "live:stream"
```
**行为**：
- 定时重新获取数据源
- 支持 WebSocket 流式数据（需后端支持）

### 8. 动画配置
**现有**：`animation: true` + `animationDuration: 1000`
**扩展**：
```cdl
@animation "easing=elasticOut,delay=100,loop=true"
```

---

## 📝 开发任务清单

### Phase 1: 新图表类型（1-2 天）
- [ ] 研究 ECharts 对应图表类型的配置
- [ ] 实现 `convertFunnel()` 函数
- [ ] 实现 `convertTreemap()` 函数
- [ ] 实现 `convertSunburst()` 函数
- [ ] 完善 `convertSankey()` 函数（检查现有实现）
- [ ] 更新 `convertChart()` 的 switch 语句
- [ ] 更新语法文档（PROMPT.md）
- [ ] 添加新图表示例到 examples/

### Phase 2: 交互增强（2-3 天）✅ 已完成
- [x] 扩展 `interaction` 类型定义
- [x] 实现 `applyDrillDown()` 函数
- [x] 实现 `applyLinkHighlight()` 函数
- [x] 实现 `applyLiveUpdate()` 逻辑
- [x] 实现 `applyAnimationConfig()` 函数
- [x] 更新 `applyInteraction()` 函数
- [x] 测试交互逻辑

### Phase 3: 测试与文档（1 天）
- [ ] 为每个新图表编写测试用例
- [ ] 更新 README.md 的功能列表
- [ ] 更新在线文档（docs/）
- [ ] 更新语法规范（GRAMMAR.md）

---

## ✅ 已完成的任务

### CDL 数据转换器 (2025-03-26)
- [x] **CSV 支持** - 完整 CSV 解析与序列化，支持引号、自动类型解析、BOM
- [x] **JSON 支持** - 对象数组格式和 DataTable 格式
- [x] **Excel 支持** - .xlsx 格式导入导出（基于 xlsx 库）
- [x] **文件 I/O** - 完整的文件导入导出功能
- [x] **内存转换** - 任意格式互转
- [x] **CDL 集成** - @import/@export 指令解析、数据管道
- [x] **类型定义** - 完整的 TypeScript 类型支持
- [x] **测试覆盖** - 25 个测试用例全部通过

**文件位置**:
- 主模块: `packages/compiler/transformer.ts`
- 集成模块: `packages/compiler/transformer-integration.ts`
- 测试文件: `packages/compiler/transformer.test.ts`
- 文档: `packages/compiler/TRANSFORMER.md`
- 示例: `packages/compiler/transformer-examples.ts`

**API 导出**:
```typescript
export {
  importFromFile, exportToFile, convertData,
  parseCSV, parseJSON, parseExcel,
  serializeCSV, serializeJSON, serializeExcel,
  createEmptyTable, addRow, mergeTables, validateTable,
  parseImportDirective, parseExportDirective,
  csvToJson, jsonToCsv, importFromUrl,
} from '@naeemo/cdl-compiler';
```

### Playground 导出功能增强 (2025-03-26)
- [x] **PNG 导出** - 高分辨率图片导出（可配置像素比、背景色）
- [x] **SVG 导出** - 矢量图形导出，支持无损缩放
- [x] **PDF 导出** - A4 格式 PDF，包含图表和源代码
- [x] **导出菜单** - 统一的下拉导出菜单，支持一键导出
- [x] **Toast 提示** - 导出成功/失败的用户反馈
- [x] **点击外部关闭** - 导出菜单点击外部自动关闭

**技术实现**:
- PNG/SVG: 使用 ECharts `getDataURL()` API
- PDF: 使用浏览器原生打印功能，生成包含图表和源代码的 A4 页面
- 文件命名: `cdl-chart.png`, `cdl-chart.svg`

---

## 🧪 测试策略

- 单元测试：每个 `convert*` 函数的输入输出
- 集成测试：完整 CDL → ECharts option 流程
- 可视化测试：导出 PNG/SVG 人工检查

---

## 📦 发布计划

完成后版本升级到 **v0.2.0**，包含：
- 6+ 新增图表类型
- 4 种新交互能力
- 更新所有依赖包（compiler, renderer, cli, ai）

---

开始开发！先实现 Funnel 图表。
