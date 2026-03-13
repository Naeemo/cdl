# VS Code 插件开发计划

## 目标
为 CDL 开发完整的 VS Code 插件，提供语法高亮、智能提示、实时预览

## 阶段划分

### Phase 1: 基础架构 ✅ 已完成
- [x] 创建 packages/vscode-extension/ 目录
- [x] 初始化 package.json
- [x] 配置 TypeScript 编译

### Phase 2: 语法高亮 ✅ 已完成
- [x] TextMate 语法定义 (cdl.tmLanguage.json)
- [x] 关键字、字符串、注释着色
- [x] 语言配置文件
- [x] 代码片段 (snippets)

### Phase 3: 扩展功能 ✅ 已完成
- [x] 扩展入口 (extension.ts)
- [x] Preview 命令
- [x] Compile 命令
- [x] Export ECharts 命令
- [x] 快捷键绑定 (Ctrl+Shift+V)

### Phase 4: 图标和文档 ✅ 已完成
- [x] 文件图标 (light/dark SVG)
- [x] README.md
- [x] CHANGELOG.md
- [x] .vscodeignore

### Phase 5: 集成真实编译器 ✅ 已完成
- [x] 集成 @cdl/compiler
- [x] 集成 @cdl/renderer-echarts
- [x] 真实预览渲染
- [x] 错误处理和主题支持

### Phase 6: 发布 🔄 进行中
- [ ] 构建并测试 vsix
- [ ] VS Code Marketplace 发布准备

## 当前阶段
Phase 6 - 打包和发布

## 状态
✅ Phase 1-5 完成 (95%)
🔄 Phase 6 进行中
