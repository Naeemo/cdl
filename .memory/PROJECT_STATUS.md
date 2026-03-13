# CDL 项目状态

## 当前状态 (2026-03-13)

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

#### 3. 渲染器 v0.1
- 文件: `packages/renderer/src/index.ts`
- 支持 8 种图表类型: line, bar, pie, scatter, area, combo, radar, heatmap
- 转换为 ECharts 配置

#### 4. 示例片段
- 数量: **54 个**
- 覆盖: SQL(20), DAX(12), 裸数据(22)

#### 5. 自然语言生成 (NL-to-CDL)
- 包: `packages/nl-codegen/`
- CLI: `cdl nl "描述"`
- Playground 集成 ✅
- Prompt 模板 + few-shot 示例

#### 6. 生态工具
- CLI: `packages/cli/bin/cdl.js`
- Playground: 在线编辑 + 实时预览
- 文档站点: VitePress

### 待完成

#### 高优先级
- [ ] **VS Code 插件** - 语法高亮、智能提示、预览
- [ ] **更多 NL 示例** - 扩展到 20+ 场景

#### 中优先级  
- [ ] **D3 渲染器** - 除了 ECharts 外的选择
- [ ] **服务端渲染** - 生成图片/PDF

#### 低优先级
- [ ] **数据连接池** - SQL 数据源连接管理
- [ ] **图表模板市场** - 分享和复用 CDL 模板

### 最近完成
- 2026-03-13: 修复 GitHub Actions CI (npm 替换 pnpm)
- 2026-03-13: 完成 NL-to-CDL Playground 集成
- 2026-03-12: 完成 NL-to-CDL CLI 和核心包
