# CDL 开发状态跟踪（v0.6 改造）

## ✅ 编译器改造完成（2026-03-14 12:30）
- ✅ `## series` 多系列表格解析
- ✅ `## axis <position>` 坐标轴块解析
- ✅ `@interaction` 交互声明解析
- ✅ 快速语法完整支持
- ✅ 类型推断
- ✅ 注释剥离、错误处理

## ✅ 渲染器改造完成（2026-03-14 12:35）
- ✅ `series` → ECharts `series` 映射（支持 combo 混合类型）
- ✅ `axis` → `xAxis/yAxis` 映射（位置自动处理）
- ✅ `interaction` → `dataZoom/brush` 映射
- ✅ 向后兼容（旧语法）
- ✅ 测试通过（test.ts）

## ✅ 端到端集成测试通过（2026-03-14 12:50）
- ✅ Compiler → Renderer 完整流程
- ✅ 4/4 v0.6 特性验证通过
- ✅ 测试文件：`packages/integration-test/test-v06.js`

---

## 🚧 工具链更新（进行中）

### CLI 工具（packages/cli）
**待更新**：
- [ ] `validate` 命令支持 v0.6 语法
- [ ] `compile` 命令输出 v0.6 AST
- [ ] `render` 命令（需要 renderer 依赖）
- [ ] 帮助文档更新
- [ ] 示例更新

### VS Code 插件（vscode-extension）
**待更新**：
- [ ] 语法高亮：添加 `## series` / `## axis` 关键字
- [ ] 代码片段：新增 combo 多轴图表模板
- [ ] 语言配置更新

---

## 📚 文档与示例

### 已完成
- [x] `GRAMMAR.md` - 完整语法规范 v0.6
- [x] `docs/guide/syntax.md` - 用户指南更新
- [x] `docs/guide/index.md` - 快速开始更新
- [x] `docs/guide/charts.md` - 图表类型详解
- [x] `docs/examples/line.md` - 折线图示例
- [x] `docs/examples/bar.md` - 柱状图示例
- [x] `docs/examples/pie.md` - 饼图示例
- [x] `README.md` - 项目首页重写（含 v0.6 路线图）

### 待补充
- [ ] `docs/examples/combo.md` - 组合图示例（v0.6 核心）
- [ ] `docs/examples/advanced-axis.md` - 多轴配置示例
- [ ] `docs/examples/interaction.md` - 交互示例
- [ ] Playground 代码更新（支持新语法）

---

## 🗓️ 后续计划

### v0.6 发布准备
1. 更新所有子包版本号（0.1.0 → 0.6.0）
2. 编写 CHANGELOG.md
3. 发布 NPM 包
4. 更新 GitHub Releases

### 后续特性（v0.7+）
- 主题系统（完整自定义）
- 响应式布局
- D3 渲染器支持
- 数据管道（谨慎评估）

---

*最后更新：2026-03-14 12:55*